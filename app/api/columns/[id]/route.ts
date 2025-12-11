import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update column
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, order, isArchived, color } = body;

    const column = await prisma.column.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(order !== undefined && { order }),
        ...(isArchived !== undefined && { isArchived }),
        ...(color !== undefined && { color }),
      },
      include: {
        cards: {
          include: {
            comments: true,
            activities: true,
            attachments: true,
          },
        },
      },
    });

    return NextResponse.json(column);
  } catch (error) {
    console.error('Error updating column:', error);
    return NextResponse.json({ error: 'Failed to update column' }, { status: 500 });
  }
}

// DELETE column (archive)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete by archiving
    await prisma.column.update({
      where: { id: params.id },
      data: { isArchived: true },
    });

    // Also archive all cards in this column
    await prisma.card.updateMany({
      where: { columnId: params.id },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving column:', error);
    return NextResponse.json({ error: 'Failed to archive column' }, { status: 500 });
  }
}
