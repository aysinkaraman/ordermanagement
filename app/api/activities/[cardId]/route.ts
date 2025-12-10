import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET activities for a card
export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const activities = await prisma.activity.findMany({
      where: { cardId: params.cardId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
