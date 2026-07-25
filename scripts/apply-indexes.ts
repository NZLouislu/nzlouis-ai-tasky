import { readFileSync } from 'fs';
import { Pool } from 'pg';
import 'dotenv/config';

async function applyIndexes() {
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
    if (!statements[i].startsWith('CREATE INDEX')) continue;

    try {
      await pool.query(statements[i]);
      console.log(`✅ ${statements[i].slice(0, 100)}`);
      success++;
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log(`⏭️  Already exists`);
        success++;
      } else {
        console.error(`❌ ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\nIndexes: ${success} created, ${failed} failed`);
  await pool.end();
}

applyIndexes();
