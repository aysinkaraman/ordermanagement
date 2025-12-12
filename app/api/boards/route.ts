import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';
function makeCuid() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = 'c';
  for (let i = 0; i < 24; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

// GET /api/boards - Get all boards user has access to
export async function GET(request: NextRequest) {
  try {
    let userId = getUserIdFromRequest(request);
    if (!userId) {
      const first = await prisma.user.findFirst({ select: { id: true } });
      if (first) userId = first.id;
    }
    if (!userId) return NextResponse.json([]);

    // Get boards where user is owner OR member
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      select: {
        id: true,
        title: true,
        isPublic: true,
        ownerId: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        },
        _count: { select: { columns: true, members: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Get boards error:', error);
    return NextResponse.json({ error: 'Failed to get boards' }, { status: 500 });
  }
}

// POST /api/boards - Create new board
export async function POST(request: NextRequest) {
  try {
    let userId = getUserIdFromRequest(request);
    if (!userId) {
      const first = await prisma.user.findFirst({ select: { id: true } });
      if (first) {
        userId = first.id;
      } else {
        // Bootstrap a default owner if no users exist
        const email = process.env.STANDUP_OWNER_EMAIL || 'owner@example.com';
        const name = 'Owner';
        const passwordHash = await bcrypt.hash('bootstrap-owner', 10);
        const owner = await prisma.user.create({ data: { email, name, password: passwordHash } });
        userId = owner.id;
      }
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
        select: {
          id: true,
          title: true,
          isPublic: true,
          ownerId: true,
          teamId: true,
          createdAt: true,
          updatedAt: true,
          owner: { select: { id: true, name: true, email: true, avatar: true } }
        }
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
