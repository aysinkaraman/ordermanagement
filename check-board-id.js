const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const envBoardId = 'cmj0fi9vj0007128xyrxe8vfk';
  
  // Check if it's a board
  const board = await prisma.board.findUnique({
    where: { id: envBoardId },
    include: { columns: true }
  });
  
  // Check if it's a column (wrong!)
  const column = await prisma.column.findUnique({
    where: { id: envBoardId }
  });
  
  console.log('\n🔍 Environment ID:', envBoardId);
  console.log('\n📋 Board check:');
  if (board) {
    console.log('✅ This IS a board!');
    console.log('Board name:', board.title);
    console.log('Columns:', board.columns.map(c => c.title).join(', '));
  } else {
    console.log('❌ NOT a board');
  }
  
  console.log('\n📊 Column check:');
  if (column) {
    console.log('⚠️ WARNING: This is a COLUMN, not a board!');
    console.log('Column name:', column.title);
  } else {
    console.log('✅ Not a column');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
