const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const card = await prisma.card.findFirst({
    where: {
      title: {
        contains: '35504'
      }
    },
    include: {
      column: true
    }
  });

  if (card) {
    console.log('\n📦 Order #35504:');
    console.log('Column:', card.column.title);
    console.log('\nFull description:');
    console.log(card.description);
  } else {
    console.log('Order not found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
