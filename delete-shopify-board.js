// Delete the auto-created "Shopify Orders" or "Falcon Board" 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAutoCreatedBoards() {
  try {
    console.log('🔍 Looking for auto-created boards...');
    
    // Find boards with specific names
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { title: 'Shopify Orders' },
          { title: 'Falcon Board' },
        ]
      },
      include: {
        columns: {
          include: {
            cards: true
          }
        }
      }
    });

    if (boards.length === 0) {
      console.log('✅ No auto-created boards found');
      return;
    }

    console.log(`\n📋 Found ${boards.length} board(s):`);
    boards.forEach(board => {
      const cardCount = board.columns.reduce((sum, col) => sum + col.cards.length, 0);
      console.log(`  - "${board.title}" (ID: ${board.id})`);
      console.log(`    Columns: ${board.columns.length}, Cards: ${cardCount}`);
    });

    console.log('\n⚠️  WARNING: This will permanently delete these boards and all their data!');
    console.log('Press Ctrl+C now to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    for (const board of boards) {
      console.log(`\n🗑️  Deleting board: "${board.title}"`);
      
      // Delete in order: cards -> columns -> board
      for (const column of board.columns) {
        await prisma.card.deleteMany({
          where: { columnId: column.id }
        });
        console.log(`  ✓ Deleted ${column.cards.length} cards from column "${column.title}"`);
      }
      
      await prisma.column.deleteMany({
        where: { boardId: board.id }
      });
      console.log(`  ✓ Deleted ${board.columns.length} columns`);
      
      await prisma.board.delete({
        where: { id: board.id }
      });
      console.log(`  ✓ Deleted board "${board.title}"`);
    }

    console.log('\n✅ Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAutoCreatedBoards();
