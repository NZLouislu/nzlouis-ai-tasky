/**
 * Script to generate bcrypt password hash for admin account
 * Usage: npx ts-node scripts/generate-admin-hash.ts
 */

import bcrypt from 'bcrypt';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function generateHash() {
  rl.question('Enter password to hash: ', async (password) => {
    if (!password || password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters long');
      rl.close();
      return;
    }

    try {
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);

      console.log('\n✅ Password hashed successfully!\n');
      console.log('Add this to your .env file:');
      console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
      console.log('⚠️  Remember to remove ADMIN_PASSWORD if it exists\n');
    } catch (error) {
      console.error('\n❌ Error generating hash:', error);
    } finally {
      rl.close();
    }
  });
}

generateHash();
