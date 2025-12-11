// Delete all test order cards
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteTestCards() {
  try {
    console.log('🔍 Looking for test order cards...');
    
    // Find all cards with "Order #" in title
    const cards = await prisma.card.findMany({
      where: {
        title: {
          contains: 'Order #'
        }
      },
      include: {
        column: {
          select: {
            title: true
          }
        }
      }
    });

    if (cards.length === 0) {
      console.log('✅ No test cards found');
      return;
    }

    console.log(`\n📦 Found ${cards.length} order card(s):\n`);
    cards.forEach(card => {
      console.log(`  - ${card.title} (in ${card.column.title})`);
    });

    console.log('\n⚠️  WARNING: This will permanently delete all order cards!');
    console.log('Press Ctrl+C now to cancel, or wait 3 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all activities, comments, attachments first
    for (const card of cards) {
      await prisma.activity.deleteMany({ where: { cardId: card.id } });
      await prisma.comment.deleteMany({ where: { cardId: card.id } });
      await prisma.attachment.deleteMany({ where: { cardId: card.id } });
    }
    
    // Delete cards
    const result = await prisma.card.deleteMany({
      where: {
        title: {
          contains: 'Order #'
        }
      }
    });

    console.log(`✅ Deleted ${result.count} order cards successfully!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestCards();
