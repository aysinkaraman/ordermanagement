import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET card details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: {
        comments: true,
        attachments: true,
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
  }
}

// PATCH update card
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, columnId, order, isArchived, dueDate, labels, coverImage } = body;

    const card = await prisma.card.findUnique({
      where: { id: params.id },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const updatedCard = await prisma.card.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(columnId !== undefined && { columnId }),
        ...(order !== undefined && { order }),
        ...(isArchived !== undefined && { isArchived }),
        ...(dueDate !== undefined && { dueDate }),
        ...(labels !== undefined && { labels }),
        ...(coverImage !== undefined && { coverImage }),
      },
      include: {
        comments: true,
        activities: true,
        attachments: true,
      },
    });

    const userId = getUserIdFromRequest(request);

    // Log activity for title change
    if (title !== undefined && title !== card.title) {
      await prisma.activity.create({
        data: {
          cardId: params.id,
          message: `Card renamed from "${card.title}" to "${title}"`,
          userId,
        },
      });
    }

    // Log activity for column move
    if (columnId !== undefined && columnId !== card.columnId) {
      await prisma.activity.create({
        data: {
          cardId: params.id,
          message: `Card moved to a different column`,
          userId,
        },
      });
    }

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

// DELETE card (archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete by archiving
    await prisma.card.update({
      where: { id: params.id },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving card:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
