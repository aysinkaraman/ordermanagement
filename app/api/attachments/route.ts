import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, filename, url, size, mimeType, note, userId: userIdFromBody } = body;
    const userId = userIdFromBody || getUserIdFromRequest(request);

    if (!cardId || !filename || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Server-side safety guard for payload size (10 MB max)
    const MAX_BYTES = 10 * 1024 * 1024;
    const declaredSize = Number(size || 0);
    if (declaredSize > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large (max 10 MB)' },
        { status: 413 }
      );
    }
    // If data URL, approximate base64 content length
    try {
      const commaIdx = typeof url === 'string' ? url.indexOf(',') : -1;
      if (commaIdx !== -1) {
        const b64 = url.slice(commaIdx + 1);
        // Base64 expands ~4/3. Check decoded length estimation
        const estimatedBytes = Math.floor((b64.length * 3) / 4);
        if (estimatedBytes > MAX_BYTES) {
          return NextResponse.json(
            { error: 'File too large (max 10 MB)' },
            { status: 413 }
          );
        }
      }
    } catch {}

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
        ...(userId ? { userId } : {}),
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
