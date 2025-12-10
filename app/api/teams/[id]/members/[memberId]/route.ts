import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// DELETE /api/teams/:id/members/:memberId - Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Cannot remove owner
    if (team.ownerId === params.memberId) {
      return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 });
    }

    await prisma.teamMember.delete({
      where: {
        id: params.memberId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
