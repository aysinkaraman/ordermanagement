const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.card.findMany({
    include: {
      column: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  console.log('\n📊 Last 10 orders:\n');
  cards.forEach(card => {
    const tags = card.description.match(/🏷️ Tags: (.+)/);
    console.log(`${card.title} → ${card.column.title}`);
    if (tags) console.log(`  Tags: ${tags[1]}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
