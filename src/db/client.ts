import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from './schema/relations.js';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) throw new Error('Database connection url missing!');

export const drizzleClient = drizzle(dbUrl, { relations });

export type DrizzleClient = typeof drizzleClient;
