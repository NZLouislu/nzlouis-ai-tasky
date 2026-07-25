import { readFileSync } from 'fs';
import { Pool } from 'pg';
import 'dotenv/config';

async function applyMigration() {
  const sql = readFileSync('drizzle/migrations/0000_light_captain_universe.sql', 'utf-8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(Boolean);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    try {
      await pool.query(statements[i]);
      console.log(`✅ [${i + 1}/${statements.length}] ${statements[i].slice(0, 80)}...`);
      success++;
    } catch (err: any) {
      // Ignore "already exists" errors
      if (err.code === '42P07' || err.code === '42710' || err.message?.includes('already exists')) {
        console.log(`⏭️  [${i + 1}/${statements.length}] Already exists, skipped`);
        success++;
      } else {
        console.error(`❌ [${i + 1}/${statements.length}] ${err.message}`);
        console.error(`   SQL: ${statements[i].slice(0, 120)}`);
        failed++;
      }
    }
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`);
  await pool.end();
}

applyMigration();
