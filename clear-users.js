const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearUsers() {
  try {
    const result = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${result.count} users from database`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();
