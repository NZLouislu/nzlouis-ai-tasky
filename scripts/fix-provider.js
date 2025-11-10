#!/usr/bin/env node

/**
 * Quick fix: Switch to available AI provider
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProvider() {
  console.log('\n🔧 Switching to available AI provider...\n');

  try {
    // Get all users
    const users = await prisma.userProfile.findMany();
    
    console.log(`Found ${users.length} users\n`);

    for (const user of users) {
      // Check if user has settings
      let settings = await prisma.userAISettings.findUnique({
        where: { userId: user.id }
      });

      if (settings) {
        // If currently using Google, switch to OpenRouter
        if (settings.defaultProvider === 'google') {
          await prisma.userAISettings.update({
            where: { userId: user.id },
            data: {
              defaultProvider: 'openrouter',
              defaultModel: 'deepseek-r1-free',
              updatedAt: new Date()
            }
          });
          console.log(`✅ Updated settings for user ${user.email || user.id}`);
          console.log(`   From: google → To: openrouter`);
        } else {
          console.log(`⚪ User ${user.email || user.id} already using ${settings.defaultProvider}`);
        }
      } else {
        // Create default settings
        await prisma.userAISettings.create({
          data: {
            userId: user.id,
            defaultProvider: 'openrouter',
            defaultModel: 'deepseek-r1-free',
            temperature: 0.8,
            maxTokens: 1024
          }
        });
        console.log(`✅ Created default settings for user ${user.email || user.id}`);
        console.log(`   Provider: openrouter`);
      }
    }

    console.log('\n✅ Complete!\n');
    console.log('Next steps:');
    console.log('1. Restart development server (if running)');
    console.log('2. Visit settings page to add OpenRouter API key');
    console.log('3. Or wait for Google API quota reset\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nIf you encounter database errors, ensure:');
    console.log('1. Database is running');
    console.log('2. DATABASE_URL is configured correctly');
    console.log('3. Have run prisma generate\n');
  } finally {
    await prisma.$disconnect();
  }
}

fixProvider();
