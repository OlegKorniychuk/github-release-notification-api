import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from './schema/relations.js';
import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) throw new Error('Database connection url missing!');

export const pool = new Pool({
  connectionString: dbUrl,
});

export const drizzleClient = drizzle({ client: pool, relations });

export type DrizzleClient = typeof drizzleClient;
