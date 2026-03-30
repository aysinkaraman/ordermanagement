import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// DELETE /api/boards/:id/members/:memberId - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params for deleteAccount flag
    const url = new URL(request.url);
    const deleteAccount = url.searchParams.get('deleteAccount') === 'true';

    // Check if user is owner or admin of this board
    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: { in: ['owner', 'admin'] } } } }
        ]
      },
      select: { id: true, ownerId: true }
    });

    if (!board) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Ensure target membership belongs to this board
    const membership = await prisma.boardMember.findFirst({
      where: {
        id: params.memberId,
        boardId: params.id,
      },
      select: { id: true, userId: true, boardId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Member not found on this board' }, { status: 404 });
    }

    // Cannot remove board owner
    if (board.ownerId === membership.userId) {
      return NextResponse.json({ error: 'Cannot remove board owner' }, { status: 400 });
    }

    // Delete the member record
    const deleted = await prisma.boardMember.deleteMany({
      where: {
        id: membership.id,
        boardId: params.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 400 });
    }

    // Optionally delete the user account if requested
    if (deleteAccount) {
      try {
        // Only delete if user has no other board/team memberships
        const otherBoardMembers = await prisma.boardMember.count({
          where: { userId: membership.userId }
        });
        const otherTeamMembers = await prisma.teamMember.count({
          where: { userId: membership.userId }
        });
        const ownedBoards = await prisma.board.count({
          where: { ownerId: membership.userId }
        });
        const ownedTeams = await prisma.team.count({
          where: { ownerId: membership.userId }
        });

        // Only delete if user has no other associations
        if (otherBoardMembers === 0 && otherTeamMembers === 0 && ownedBoards === 0 && ownedTeams === 0) {
          await prisma.user.delete({
            where: { id: membership.userId }
          });
          return NextResponse.json({ success: true, accountDeleted: true });
        }
      } catch (error) {
        console.error('Error deleting user account:', error);
        // Don't fail the member removal if account deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
