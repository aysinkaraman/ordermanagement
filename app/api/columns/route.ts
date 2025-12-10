import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET all columns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get('archived') === 'true';
    const mode = searchParams.get('mode') || 'cards'; // 'cards' or 'lists'
    
    if (showArchived) {
      if (mode === 'lists') {
        // For archived lists view: get archived columns with their archived cards
        const columns = await prisma.column.findMany({
          where: { isArchived: true },
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
          where: { isArchived: false },
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
      // For normal view: get non-archived columns with non-archived cards
      const columns = await prisma.column.findMany({
        where: { isArchived: false },
        orderBy: { order: 'asc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          cards: {
            where: { isArchived: false },
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
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
  }
}

// POST create new column
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body;
    const userId = getUserIdFromRequest(request);

    const maxOrderColumn = await prisma.column.findFirst({
      orderBy: { order: 'desc' },
    });

    const newOrder = (maxOrderColumn?.order ?? -1) + 1;

    const column = await prisma.column.create({
      data: {
        title,
        order: newOrder,
        userId,
      },
      include: {
        cards: true,
        user: true,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json({ error: 'Failed to create column' }, { status: 500 });
  }
}
