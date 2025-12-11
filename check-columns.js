const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const board = await prisma.board.findUnique({
    where: { id: 'cmj0fi9vj0007128xyrxe8vfk' },
    include: {
      columns: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (board) {
    console.log('\n📋 Board:', board.title);
    console.log('\n📊 Columns:');
    board.columns.forEach((col, i) => {
      console.log(`${i+1}. "${col.title}" (ID: ${col.id})`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
