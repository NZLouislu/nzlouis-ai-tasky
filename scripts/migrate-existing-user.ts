import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.log('Usage: npx tsx scripts/migrate-existing-user.ts <userId>');
    console.log('Checks if user_profiles table has the user, and creates a placeholder if not.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  const { rows: existing } = await pool.query('SELECT id, email FROM user_profiles WHERE id = $1', [userId]);

  if (existing.length > 0) {
    console.log(`User ${userId} already exists: ${existing[0].email || 'no email'}`);
  } else {
    await pool.query(
      `INSERT INTO user_profiles (id, email, name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`,
      [userId, `${userId.substring(0, 8)}@placeholder.com`, 'User']
    );
    console.log(`Created placeholder user profile for ${userId}`);
  }

  await pool.end();
}

main();
