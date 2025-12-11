// List all boards
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listBoards() {
  try {
    const boards = await prisma.board.findMany({
      include: {
        columns: {
          include: {
            _count: {
              select: { cards: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        owner: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`\n📋 Found ${boards.length} board(s):\n`);
    
    boards.forEach((board, index) => {
      console.log(`${index + 1}. "${board.title}"`);
      console.log(`   ID: ${board.id}`);
      console.log(`   Owner: ${board.owner.name} (${board.owner.email})`);
      console.log(`   Created: ${board.createdAt.toLocaleString()}`);
      console.log(`   Columns (${board.columns.length}):`);
      board.columns.forEach(col => {
        console.log(`     - ${col.title} (order: ${col.order}, cards: ${col._count.cards})`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listBoards();
