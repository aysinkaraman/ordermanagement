import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// POST /api/boards/:id/members - Add member to board or create invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await request.json();

    // Check if user can share this board (owner or any existing member)
    const board = await prisma.board.findUnique({
      where: {
        id: params.id,
      },
      select: { id: true, ownerId: true }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Allow sharing if user is the owner OR is a member of the board
    const isOwner = String(board.ownerId) === String(userId);
    const isMember = !isOwner && await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: params.id,
          userId
        }
      }
    });

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Not authorized to share this board' }, { status: 403 });
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, avatar: true }
    });

    if (!userToAdd) {
      // User doesn't exist - create invitation
      const { randomBytes } = await import('crypto');
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.invitation.create({
        data: {
          email,
          token,
          boardId: params.id,
          role: role || 'member',
          senderId: userId,
          expiresAt
        }
      });

      const inviteLink = `https://falconordermanagement.com/login?invite=${token}`;

      return NextResponse.json({ 
        message: 'Invitation sent! Share this link with them.',
        inviteLink,
        needsInvite: true
      });
    }

    // Check if already member
    const existingMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: params.id,
          userId: userToAdd.id
        }
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add member
    const member = await prisma.boardMember.create({
      data: {
        boardId: params.id,
        userId: userToAdd.id,
        role: role || 'member'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Member added successfully',
      member 
    });
  } catch (error) {
    console.error('Add member error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add member';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET /api/boards/:id/members - Get board members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check access
    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { isPublic: true }
        ]
      },
      select: {
        id: true,
        ownerId: true,
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const members = await prisma.boardMember.findMany({
      where: { boardId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Ensure owner is always present and always labeled as owner
    const normalized = members.map((m) =>
      String(m.userId) === String(board.ownerId) ? { ...m, role: 'owner' } : m
    );

    const ownerAlreadyPresent = normalized.some((m) => String(m.userId) === String(board.ownerId));
    if (!ownerAlreadyPresent && board.owner) {
      normalized.unshift({
        id: `owner-${board.owner.id}`,
        boardId: board.id,
        userId: board.owner.id,
        role: 'owner',
        createdAt: new Date(0),
        user: board.owner,
      } as any);
    }

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json({ error: 'Failed to get members' }, { status: 500 });
  }
}
