import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = getUserIdFromRequest(request);

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    await prisma.attachment.delete({
      where: { id },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        cardId: attachment.cardId,
        message: `Removed attachment: ${attachment.filename}`,
        ...(userId ? { userId } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { note } = body;

    const updated = await prisma.attachment.update({
      where: { id },
      data: {
        ...(note !== undefined ? { note } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating attachment:', error);
    return NextResponse.json(
      { error: 'Failed to update attachment' },
      { status: 500 }
    );
  }
}
