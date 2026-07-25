import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  const { rows: indexes } = await pool.query(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename NOT IN ('properties', 'property_history_events', 'real_estate', 'real_estate_rent', 'scraping_progress')
    ORDER BY tablename, indexname
  `);
  
  console.log('Indexes on Tasky tables:');
  indexes.forEach((r: any) => console.log(`  ${r.tablename}: ${r.indexname}`));
  console.log(`\nTotal: ${indexes.length} indexes`);
  
  await pool.end();
}
main();
