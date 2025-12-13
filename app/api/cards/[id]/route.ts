import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET card details
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: {
        comments: true,
        attachments: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        column: { select: { id: true, boardId: true, title: true } },
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
    const { title, description, columnId, order, isArchived, dueDate, labels, coverImage, userId: userIdFromBody } = body;

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

    // Use userId from body if provided, else from request (cookie)
    const userId = userIdFromBody || getUserIdFromRequest(request);


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
      // Fetch destination and source column names for a clearer message
      const [toColumn, fromColumn] = await Promise.all([
        prisma.column.findUnique({
          where: { id: columnId },
          select: { title: true },
        }),
        card.columnId
          ? prisma.column.findUnique({
              where: { id: card.columnId },
              select: { title: true },
            })
          : Promise.resolve(null),
      ]);

      const toName = (toColumn?.title || 'Unknown').toString();
      const fromName = (fromColumn?.title || 'Unknown').toString();

      await prisma.activity.create({
        data: {
          cardId: params.id,
          message: `Card moved from "${fromName}" to "${toName}"`,
          userId,
        },
      });
    }

    // Log activity for order change
    if (order !== undefined && order !== card.order) {
      await prisma.activity.create({
        data: {
          cardId: params.id,
          message: `Card order changed to ${order}`,
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
  _request: NextRequest,
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
