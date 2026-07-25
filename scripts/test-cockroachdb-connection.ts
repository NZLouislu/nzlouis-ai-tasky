import { Pool } from 'pg';
import 'dotenv/config';

async function testCockroachDB() {
  const connectionString = process.env.DATABASE_URL_COCKROACH || 
    `postgresql://${process.env.COCKROACH_USER}:${process.env.COCKROACH_PASSWORD}@${process.env.COCKROACH_HOST}:${process.env.COCKROACH_PORT}/${process.env.COCKROACH_DB}?sslmode=verify-full`;

  if (!connectionString || connectionString === 'undefined') {
    console.error('CockroachDB connection info not found in .env');
    process.exit(1);
  }

  console.log('Testing CockroachDB connection...');
  console.log('Connection string:', connectionString.replace(/\/\/.*:.*@/, '//user:pass@'));

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected!');

    // Check PostgreSQL version (CockroachDB reports as PostgreSQL)
    const { rows: [version] } = await client.query('SELECT version()');
    console.log('   Version:', version.version);

    // List existing tables
    console.log('\nExisting tables:');
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    if (tables.length === 0) {
      console.log('   (no tables yet - database is fresh)');
    } else {
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    client.release();
    await pool.end();
    console.log('\n✅ CockroachDB connection successful!');
  } catch (error: any) {
    console.error('\n❌ CockroachDB connection failed:', error.message);
    if (error.code) console.error('   Error code:', error.code);
  }
}

testCockroachDB();
