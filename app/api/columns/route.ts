import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET all columns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get('archived') === 'true';
    const mode = searchParams.get('mode') || 'cards'; // 'cards' or 'lists'
    const boardId = searchParams.get('boardId');
    
    if (showArchived) {
      if (mode === 'lists') {
        // For archived lists view: get archived columns with their archived cards
        const columns = await prisma.column.findMany({
          where: { 
            isArchived: true,
            ...(boardId && { boardId }),
          },
          orderBy: { order: 'asc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            cards: {
              where: { isArchived: true },
              orderBy: { order: 'asc' },
              include: {
                user: { select: { id: true, name: true, avatar: true } },
                comments: { orderBy: { createdAt: 'desc' } },
                activities: { 
                  orderBy: { createdAt: 'desc' },
                  include: { user: { select: { id: true, name: true, avatar: true } } },
                },
                attachments: true,
              },
            },
          },
        });
        return NextResponse.json(columns);
      } else {
        // For archived cards view: get all non-archived columns but only archived cards
        const columns = await prisma.column.findMany({
          where: { 
            isArchived: false,
            ...(boardId && { boardId }),
          },
          orderBy: { order: 'asc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            cards: {
              where: { isArchived: true },
              orderBy: { order: 'asc' },
              include: {
                user: { select: { id: true, name: true, avatar: true } },
                comments: { orderBy: { createdAt: 'desc' } },
                activities: { 
                  orderBy: { createdAt: 'desc' },
                  include: { user: { select: { id: true, name: true, avatar: true } } },
                },
                attachments: true,
              },
            },
          },
        });
        return NextResponse.json(columns);
      }
    } else {
      // For normal view: fetch lean payload (no heavy sub-relations)
      const columns = await prisma.column.findMany({
        where: {
          isArchived: false,
          ...(boardId && { boardId }),
        },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          isArchived: true,
          boardId: true,
          user: { select: { id: true, name: true, avatar: true } },
          cards: {
            where: { isArchived: false },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              columnId: true,
              title: true,
              description: true,
              order: true,
              createdAt: true,
              dueDate: true,
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      });
      return new NextResponse(JSON.stringify(columns), {
        headers: {
          'Content-Type': 'application/json',
          // Tiny CDN cache to mask serverless cold start without harming freshness
          'Cache-Control': 's-maxage=2, stale-while-revalidate=10',
        },
      });
    }
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
  }
}

// POST create new column
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, boardId } = body;
    const userId = getUserIdFromRequest(request);
    
    console.log('📝 Creating column:', { title, boardId, userId });
    
    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
    }

    const maxOrderColumn = await prisma.column.findFirst({
      orderBy: { order: 'desc' },
    });

    const newOrder = (maxOrderColumn?.order ?? -1) + 1;

    const column = await prisma.column.create({
      data: {
        title,
        order: newOrder,
        userId,
        boardId,
      },
      include: {
        cards: true,
        user: true,
      },
    });
    
    console.log('✅ Column created:', column.id, 'in board:', boardId);

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json({ error: 'Failed to create column' }, { status: 500 });
  }
}
