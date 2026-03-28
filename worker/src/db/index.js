import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import env from '../config/env.js';
import * as schema from './schema.js';

const { Pool } = pkg;

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const pool = new Pool({
  connectionString: env.databaseUrl,
});

export const db = drizzle(pool, { schema });
