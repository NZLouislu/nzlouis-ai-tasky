#!/usr/bin/env node

/**
 * Update all users' AI settings to stable default values
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserSettings() {
  console.log('\n🔧 Updating user AI settings...\n');

  try {
    // Update all users using gemini-2.5-flash
    const result1 = await prisma.userAISettings.updateMany({
      where: {
        defaultProvider: 'google',
        defaultModel: 'gemini-2.5-flash',
      },
      data: {
        defaultModel: 'gemini-1.5-flash',
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Updated ${result1.count} users from gemini-2.5-flash to gemini-1.5-flash`);

    // Update all users using gemini-2.5-pro
    const result2 = await prisma.userAISettings.updateMany({
      where: {
        defaultProvider: 'google',
        defaultModel: 'gemini-2.5-pro',
      },
      data: {
        defaultModel: 'gemini-1.5-pro',
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Updated ${result2.count} users from gemini-2.5-pro to gemini-1.5-pro`);

    // Update all users using OpenRouter paid models to free models
    const result3 = await prisma.userAISettings.updateMany({
      where: {
        defaultProvider: 'openrouter',
        defaultModel: 'deepseek-r1',
      },
      data: {
        defaultModel: 'deepseek-r1-free',
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Updated ${result3.count} users from deepseek-r1 to deepseek-r1-free`);

    const result4 = await prisma.userAISettings.updateMany({
      where: {
        defaultProvider: 'openrouter',
        defaultModel: 'deepseek-v3',
      },
      data: {
        defaultModel: 'deepseek-v3-free',
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Updated ${result4.count} users from deepseek-v3 to deepseek-v3-free`);

    // Display current settings for all users
    const allSettings = await prisma.userAISettings.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log('\n📊 Current user settings:\n');
    allSettings.forEach(setting => {
      console.log(`  ${setting.user.email || setting.userId}:`);
      console.log(`    Provider: ${setting.defaultProvider}`);
      console.log(`    Model: ${setting.defaultModel}`);
      console.log('');
    });

    console.log('✅ Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserSettings();
