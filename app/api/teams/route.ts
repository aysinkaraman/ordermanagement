import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// GET /api/teams - Get all teams user is part of
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        _count: {
          select: { boards: true, members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json({ error: 'Failed to get teams' }, { status: 500 });
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, avatar } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        avatar: avatar || null,
        ownerId: userId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
