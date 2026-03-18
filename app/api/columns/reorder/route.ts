import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// POST /api/columns/reorder
// Body: { boardId: string, orderedColumnIds: string[] }
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId, orderedColumnIds } = await request.json();

    if (!boardId || !Array.isArray(orderedColumnIds) || orderedColumnIds.length === 0) {
      return NextResponse.json({ error: 'boardId and orderedColumnIds are required' }, { status: 400 });
    }

    // Must be owner or member of this board
    const board = await prisma.board.findFirst({
      where: {
        id: String(boardId),
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });

    if (!board) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const ids = orderedColumnIds.map((id: any) => String(id));

    // Ensure all ids belong to board and are unique
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      return NextResponse.json({ error: 'orderedColumnIds contains duplicates' }, { status: 400 });
    }

    const columnsOnBoard = await prisma.column.findMany({
      where: { boardId: String(boardId), isArchived: false },
      select: { id: true },
    });

    const boardIds = new Set(columnsOnBoard.map((c) => c.id));
    const allIdsValid = ids.every((id) => boardIds.has(id));
    if (!allIdsValid) {
      return NextResponse.json({ error: 'orderedColumnIds contains invalid ids for this board' }, { status: 400 });
    }

    // Atomically persist order
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.column.update({
          where: { id },
          data: { order: index },
          select: { id: true },
        })
      )
    );

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Reorder columns error:', error);
    return NextResponse.json({ error: 'Failed to reorder columns' }, { status: 500 });
  }
}
