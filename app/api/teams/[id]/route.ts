import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/teams/:id - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
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
        boards: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true }
            },
            _count: {
              select: { columns: true, members: true }
            }
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json({ error: 'Failed to get team' }, { status: 500 });
  }
}

// PATCH /api/teams/:id - Update team
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, avatar } = await request.json();

    // Check if user is owner or admin
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'admin' } } }
        ]
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(avatar !== undefined && { avatar })
      }
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

// DELETE /api/teams/:id - Delete team
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
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        ownerId: userId
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.team.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
