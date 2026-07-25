import { Pool } from 'pg';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Redis } from '@upstash/redis';
import 'dotenv/config';

async function testAll() {
  // 1. CockroachDB via pg
  console.log('\n🔷 CockroachDB:');
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const { rows } = await pool.query('SELECT version()');
    console.log(`   ✅ ${rows[0].version}`);
    const { rows: tables } = await pool.query("SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(`   Tables: ${tables[0].cnt}`);
    await pool.end();
  } catch (e: any) {
    console.log(`   ❌ ${e.message}`);
  }

  // 2. CockroachDB via Drizzle
  console.log('\n🔷 Drizzle:');
  try {
    const { db } = await import('../src/lib/db/connection');
    const result = await db.execute('SELECT 1 as ok');
    console.log(`   ✅ Query OK: ${JSON.stringify(result.rows?.[0] || result[0])}`);
  } catch (e: any) {
    console.log(`   ❌ ${e.message}`);
  }

  // 3. R2
  console.log('\n🔷 R2:');
  try {
    const r2 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    const { KeyCount } = await r2.send(new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      MaxKeys: 1,
    }));
    console.log(`   ✅ Bucket accessible, ${KeyCount} objects`);
  } catch (e: any) {
    console.log(`   ❌ ${e.message}`);
  }

  // 4. Upstash Redis
  console.log('\n🔷 Upstash Redis:');
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.set('test:ping', 'pong', { ex: 10 });
    const val = await redis.get('test:ping');
    console.log(`   ✅ Set/Get: ${val}`);
  } catch (e: any) {
    console.log(`   ❌ ${e.message}`);
  }

  console.log('\n=== All connection tests complete ===');
}

testAll();
