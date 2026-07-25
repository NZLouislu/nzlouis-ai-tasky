import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const { rows } = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Tables in CockroachDB:');
  if (rows.length === 0) {
    console.log('  (none)');
  } else {
    rows.forEach(r => console.log(`  - ${r.table_name}`));
  }
  await pool.end();
}
main();
