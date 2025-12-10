import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/health - Check database and tables
export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.$connect();
    
    // Check if tables exist
    const userCount = await prisma.user.count();
    const boardCount = await prisma.board.count();
    const teamCount = await prisma.team.count();
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      tables: {
        users: userCount,
        boards: boardCount,
        teams: teamCount
      },
      migrations: 'OK'
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      hint: 'Run: npx prisma migrate deploy'
    }, { status: 500 });
  }
}
