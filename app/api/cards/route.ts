import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// POST create card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { columnId, title, description } = body;
    const userId = getUserIdFromRequest(request);

    const maxOrderCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
    });

    const newOrder = (maxOrderCard?.order ?? -1) + 1;

    const card = await prisma.card.create({
      data: {
        columnId,
        title,
        description: description || null,
        order: newOrder,
        userId,
      },
      include: {
        comments: true,
        activities: true,
        user: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        cardId: card.id,
        message: `Card "${card.title}" created`,
        userId,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
