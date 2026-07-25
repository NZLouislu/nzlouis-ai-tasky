import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as taskySchema from './schema/tasky';
import * as blogSchema from './schema/blog';
import * as storiesSchema from './schema/stories';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, {
  schema: { ...taskySchema, ...blogSchema, ...storiesSchema },
  logger: process.env.NODE_ENV === 'development',
});

export { pool };
