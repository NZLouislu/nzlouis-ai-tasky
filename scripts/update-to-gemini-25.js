#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateToGemini25() {
  console.log('\n🔧 Updating user settings to Gemini 2.5...\n');

  try {
    const result = await prisma.userAISettings.updateMany({
      where: {
        defaultProvider: 'google',
      },
      data: {
        defaultModel: 'gemini-2.5-flash',
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Updated ${result.count} users to gemini-2.5-flash\n`);

    // Display updated settings
    const settings = await prisma.userAISettings.findMany({
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    console.log('📊 Current settings:\n');
    settings.forEach(s => {
      console.log(`  ${s.user.email || s.userId}:`);
      console.log(`    Provider: ${s.defaultProvider}`);
      console.log(`    Model: ${s.defaultModel}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateToGemini25();
