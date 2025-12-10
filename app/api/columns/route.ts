import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all columns
export async function GET() {
  try {
    const columns = await prisma.column.findMany({
      orderBy: { order: 'asc' },
      include: {
        cards: {
          orderBy: { order: 'asc' },
          include: {
            comments: { orderBy: { createdAt: 'desc' } },
            activities: { orderBy: { createdAt: 'desc' } },
            attachments: true,
          },
        },
      },
    });
    return NextResponse.json(columns);
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

    const maxOrderColumn = await prisma.column.findFirst({
      orderBy: { order: 'desc' },
    });

    const newOrder = (maxOrderColumn?.order ?? -1) + 1;

    const column = await prisma.column.create({
      data: {
        title,
        order: newOrder,
      },
      include: {
        cards: true,
      },
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json({ error: 'Failed to create column' }, { status: 500 });
  }
}
