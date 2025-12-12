import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/boards - Get all boards user has access to
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, isPublic } = await request.json();

    const board = await prisma.board.create({
      data: {
        title: title || 'My Kanban Board',
        isPublic: isPublic || false,
        ownerId: userId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error('Create board error:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
