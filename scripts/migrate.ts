/**
 * Applies pending migrations from ./drizzle to DATABASE_URL.
 * Runs automatically with `npm run dev`. Run it against production before each deploy
 * (see "Deploy" in the README). Safe to run more than once.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

async function main() {
  const client = postgres(url!, { max: 1, onnotice: () => {} });
  // Wait for the database to accept connections (the dev database may still be starting).
  for (let attempt = 1; ; attempt++) {
    try {
      await client`select 1`;
      break;
    } catch (error) {
      if (attempt >= 30) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  await migrate(drizzle(client), { migrationsFolder: './drizzle' });
  await client.end();
  console.log('Database is up to date.');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
