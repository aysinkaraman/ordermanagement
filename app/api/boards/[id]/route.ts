import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/boards/:id - Get board details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { isPublic: true }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        columns: {
          where: { isArchived: false },
          include: {
            cards: {
              where: { isArchived: false },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Get board error:', error);
    return NextResponse.json({ error: 'Failed to get board' }, { status: 500 });
  }
}

// PATCH /api/boards/:id - Update board
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, isPublic } = await request.json();

    // Check if user is owner or admin
    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'admin' } } }
        ]
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updatedBoard = await prisma.board.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(isPublic !== undefined && { isPublic })
      }
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error('Update board error:', error);
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
  }
}

// DELETE /api/boards/:id - Delete board
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owner can delete
    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        ownerId: userId
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.board.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete board error:', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}
