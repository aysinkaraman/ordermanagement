import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST create comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, text } = body;

    const comment = await prisma.comment.create({
      data: {
        cardId,
        text,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        cardId,
        message: 'Comment added',
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
