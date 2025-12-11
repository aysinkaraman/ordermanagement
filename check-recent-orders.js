const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.card.findMany({
    include: {
      column: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  console.log('\n📊 Last 5 orders:\n');
  cards.forEach(card => {
    const tagsMatch = card.description.match(/🏷️ Tags: (.+)/);
    const tags = tagsMatch ? tagsMatch[1] : 'No tags';
    console.log(`${card.title}`);
    console.log(`  Column: ${card.column.title}`);
    console.log(`  Tags: ${tags}`);
    console.log(`  Created: ${card.createdAt.toISOString()}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
