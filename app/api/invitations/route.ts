import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { randomBytes } from 'crypto';

// POST /api/invitations - Create invitation (for board or team)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, boardId, teamId, role } = await request.json();

    if (!email || (!boardId && !teamId)) {
      return NextResponse.json({ error: 'Email and boardId or teamId required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // If user exists, add them directly
      if (boardId) {
        const board = await prisma.board.findFirst({
          where: { id: boardId, OR: [{ ownerId: userId }, { members: { some: { userId, role: { in: ['owner', 'admin'] } } } }] },
          select: { id: true, ownerId: true }
        });
        if (!board) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

        const existing = await prisma.boardMember.findUnique({
          where: { boardId_userId: { boardId, userId: existingUser.id } }
        });
        if (existing) return NextResponse.json({ error: 'User is already a member' }, { status: 400 });

        await prisma.boardMember.create({
          data: { boardId, userId: existingUser.id, role: role || 'member' }
        });
      } else if (teamId) {
        const team = await prisma.team.findFirst({
          where: { id: teamId, OR: [{ ownerId: userId }, { members: { some: { userId, role: { in: ['owner', 'admin'] } } } }] }
        });
        if (!team) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

        const existing = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId, userId: existingUser.id } }
        });
        if (existing) return NextResponse.json({ error: 'User is already a member' }, { status: 400 });

        await prisma.teamMember.create({
          data: { teamId, userId: existingUser.id, role: role || 'member' }
        });
      }

      return NextResponse.json({ 
        message: 'User added successfully',
        userExists: true 
      });
    }

    // Create invitation for new user
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.invitation.create({
      data: {
        email,
        token,
        boardId: boardId || null,
        teamId: teamId || null,
        role: role || 'member',
        senderId: userId,
        expiresAt
      }
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/register?invite=${token}`;

    return NextResponse.json({
      message: 'Invitation created',
      inviteLink,
      expiresAt,
      userExists: false
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

// GET /api/invitations/:token - Get invitation details
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        sender: {
          select: { name: true, email: true }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.accepted) {
      return NextResponse.json({ error: 'Invitation already used' }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
    }

    return NextResponse.json({
      email: invitation.email,
      sender: invitation.sender,
      boardId: invitation.boardId,
      teamId: invitation.teamId,
      role: invitation.role
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    return NextResponse.json({ error: 'Failed to get invitation' }, { status: 500 });
  }
}
