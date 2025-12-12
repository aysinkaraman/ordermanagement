import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

function startOfToday(tzOffsetMinutes = 0) {
  const now = new Date();
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(utc - tzOffsetMinutes * 60 * 1000);
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Default to Canada Eastern Time (UTC-5) in December: -300 minutes
    const tz = parseInt(process.env.STANDUP_TZ_MINUTES || '-300', 10) || -300;
    const todayStart = startOfToday(tz);

    const board = await prisma.board.findFirst({ where: { title: 'Daily Standup' } });
    if (!board) return NextResponse.json({ success: true, archived: 0 });

    const columns = await prisma.column.findMany({ where: { boardId: board.id } });
    const columnIds = columns.map(c => c.id);

    const toArchive = await prisma.card.findMany({
      where: {
        columnId: { in: columnIds },
        isArchived: false,
        createdAt: { lt: todayStart },
      },
      select: { id: true },
    });

    if (toArchive.length === 0) return NextResponse.json({ success: true, archived: 0 });

    await prisma.card.updateMany({
      where: { id: { in: toArchive.map(c => c.id) } },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true, archived: toArchive.length });
  } catch (error: any) {
    console.error('Standup archive error:', error);
    return NextResponse.json({ error: error.message || 'Failed to archive standup cards' }, { status: 500 });
  }
}
