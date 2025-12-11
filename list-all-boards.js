const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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
  
  console.log('\n📋 All Boards:\n');
  boards.forEach((board, i) => {
    console.log(`${i+1}. ${board.title}`);
    console.log(`   ID: ${board.id}`);
    console.log(`   Owner: ${board.owner.name} (${board.owner.email})`);
    console.log(`   Columns: ${board.columns.map(c => c.title).join(', ')}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
