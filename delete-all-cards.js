// Delete ALL cards from the board
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllCards() {
  try {
    console.log('🔍 Counting all cards...');
    
    const cardCount = await prisma.card.count();
    
    if (cardCount === 0) {
      console.log('✅ No cards found - board is already clean');
      return;
    }

    console.log(`\n📦 Found ${cardCount} card(s) total\n`);
    console.log('⚠️  WARNING: This will permanently delete ALL cards from ALL boards!');
    console.log('Press Ctrl+C now to cancel, or wait 3 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🗑️  Deleting activities...');
    await prisma.activity.deleteMany({});
    
    console.log('🗑️  Deleting comments...');
    await prisma.comment.deleteMany({});
    
    console.log('🗑️  Deleting attachments...');
    await prisma.attachment.deleteMany({});
    
    console.log('🗑️  Deleting cards...');
    const result = await prisma.card.deleteMany({});

    console.log(`\n✅ Deleted ${result.count} cards successfully!`);
    console.log('✨ Board is now clean and ready for new orders!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllCards();
