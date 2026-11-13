import { connection } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/db';

/** For uptime checks and load balancers: 200 when the app and database respond. */
export async function GET() {
  await connection();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, time: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }
}
