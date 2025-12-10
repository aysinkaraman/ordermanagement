import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, filename, url, size, mimeType, note } = body;

    if (!cardId || !filename || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const attachment = await prisma.attachment.create({
      data: {
        cardId,
        filename,
        url,
        size: size || 0,
        mimeType: mimeType || 'application/octet-stream',
        note: note || null,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        cardId,
        message: `Added attachment: ${filename}`,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error creating attachment:', error);
    return NextResponse.json(
      { error: 'Failed to create attachment' },
      { status: 500 }
    );
  }
}
