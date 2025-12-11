require('dotenv').config({ path: '.env.production' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔗 Connected to:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  const boards = await prisma.board.findMany({
    include: {
      columns: {
        orderBy: { order: 'asc' }
      },
      owner: {
        select: { name: true, email: true }
      }
    }
  });
  
  console.log(`\n📋 Found ${boards.length} board(s):\n`);
  boards.forEach((board, i) => {
    console.log(`${i+1}. "${board.title}"`);
    console.log(`   🆔 Board ID: ${board.id}`);
    console.log(`   👤 Owner: ${board.owner.name} (${board.owner.email})`);
    console.log(`   📊 Columns (${board.columns.length}): ${board.columns.map(c => c.title).join(', ')}`);
    console.log('');
  });
  
  console.log('💡 Use this Board ID in SHOPIFY_TARGET_BOARD_ID environment variable');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
