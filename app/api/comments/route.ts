import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// POST create comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, text } = body;
    const userId = getUserIdFromRequest(request);

    const comment = await prisma.comment.create({
      data: {
        cardId,
        text,
        ...(userId ? { userId } : {}),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        cardId,
        message: 'Comment added',
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
