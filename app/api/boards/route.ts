import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
function makeCuid() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'c';
  for (let i = 0; i < 24; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

// GET /api/boards - Get all boards user has access to
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageParam = Number(searchParams.get('page') || '1');
    const limitParam = Number(searchParams.get('limit') || '20');
    const includeMembers = searchParams.get('includeMembers') === 'true';
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limitRaw = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20;
    const limit = Math.min(Math.max(limitRaw, 1), 50); // cap to protect DB/memory
    const skip = (page - 1) * limit;

    // Get boards where user is owner OR member
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      // any-cast select to include new 'logo' before prisma regenerate
      select: ({
        id: true,
        title: true,
        isPublic: true,
        ownerId: true,
        teamId: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        ...(includeMembers
          ? {
              members: {
                select: {
                  id: true,
                  role: true,
                  user: { select: { id: true, name: true, email: true, avatar: true } }
                }
              }
            }
          : {}),
        _count: { select: { columns: true, members: true } }
      } as any),
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    });

    // Lightweight total count for pagination (optional but useful); protect with cheap count
    const total = await prisma.board.count({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    });

    return new NextResponse(JSON.stringify(boards), {
      headers: {
        'Content-Type': 'application/json',
        // Small CDN cache to cut cold TTFB while remaining fresh
        'Cache-Control': 's-maxage=10, stale-while-revalidate=60',
        'X-Total-Count': String(total),
        'X-Page': String(page),
        'X-Limit': String(limit),
      },
    });
  } catch (error) {
    console.error('Get boards error:', error);
    return NextResponse.json({ error: 'Failed to get boards' }, { status: 500 });
  }
}

// POST /api/boards - Create new board
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, isPublic } = await request.json();

    let board;
    try {
      board = await prisma.board.create({
        data: {
          title: title || 'My Kanban Board',
          isPublic: isPublic || false,
          ownerId: userId
        },
        select: ({
          id: true,
          title: true,
          isPublic: true,
          ownerId: true,
          teamId: true,
          logo: true,
          createdAt: true,
          updatedAt: true,
          owner: { select: { id: true, name: true, email: true, avatar: true } }
        } as any)
      });
    } catch (err: any) {
      // Fallback for prod DB missing extra columns (e.g., primaryColor)
      if (err?.code === 'P2022') {
        const _title = title || 'My Kanban Board';
        const _isPublic = !!isPublic;
        const id = makeCuid();
        const now = new Date();
        const result = await prisma.$queryRawUnsafe<any[]>(
          'INSERT INTO "Board" ("id", "title", "isPublic", "ownerId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "id", "title", "isPublic", "ownerId", "teamId", "createdAt", "updatedAt"',
          id,
          _title,
          _isPublic,
          userId,
          now,
          now
        );
        const row = result?.[0];
        if (row) {
          const owner = await prisma.user.findUnique({ where: { id: row.ownerId }, select: { id: true, name: true, email: true, avatar: true } });
          board = { ...row, owner } as any;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Create board error:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
