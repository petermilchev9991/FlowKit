import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

/**
 * One Postgres client per process. In development Next.js reloads modules on
 * every change, so the client is cached on `globalThis` to avoid opening a new
 * pool each time.
 *
 * Locally, `npm run dev` starts an embedded Postgres (PGlite) on port 54322, so no
 * Docker or install is needed. In production, point DATABASE_URL at any
 * Postgres: Neon, Supabase, RDS, your own server.
 */
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  }
  const isLocalPglite = url.includes(':54322/');
  return postgres(url, {
    // The embedded dev database handles one query at a time.
    max: isLocalPglite ? 1 : 10,
    prepare: !isLocalPglite,
    onnotice: () => {},
  });
}

const client = globalForDb.pgClient ?? createClient();
if (process.env.NODE_ENV !== 'production') globalForDb.pgClient = client;

export const db: PostgresJsDatabase<typeof schema> = drizzle(client, { schema });
export { schema };
