const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.userAISettings.findMany({
      include: {
        user: {
          select: { email: true }
        }
      }
    });
    
    console.log('\nCurrent user settings:\n');
    settings.forEach(s => {
      console.log(`User: ${s.user.email || s.userId}`);
      console.log(`  Provider: ${s.defaultProvider}`);
      console.log(`  Model: ${s.defaultModel}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
