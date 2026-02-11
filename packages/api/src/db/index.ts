import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema.js';

export type Database = ReturnType<typeof buildDb>;

function buildDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

const dbCache = new Map<string, Database>();

export function createDb(databaseUrl: string): Database {
  const cached = dbCache.get(databaseUrl);
  if (cached) return cached;

  const db = buildDb(databaseUrl);
  dbCache.set(databaseUrl, db);
  return db;
}
