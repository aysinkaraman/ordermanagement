import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// POST /api/teams/:id/members - Add member to team
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

    // Check if user is owner or admin
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: { in: ['owner', 'admin'] } } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, avatar: true }
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.id,
          userId: userToAdd.id
        }
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add member
    const member = await prisma.teamMember.create({
      data: {
        teamId: params.id,
        userId: userToAdd.id,
        role: role || 'member'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

// GET /api/teams/:id/members - Get team members
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
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json({ error: 'Failed to get members' }, { status: 500 });
  }
}
