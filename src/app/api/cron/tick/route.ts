import { after } from 'next/server';

import { runDueSchedules } from '@/lib/scheduler';

export const maxDuration = 300;

/**
 * Starts every scheduled workflow that is due. Call it once a minute:
 *  - Vercel: add a cron job in vercel.json (see the README) and set
 *    CRON_SECRET in the project's environment; Vercel sends it automatically.
 *  - Your own server: src/instrumentation.ts calls it for you.
 *  - Anywhere else: any cron service, with the header
 *    "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: Request) {
  const allowed = [process.env.CRON_SECRET, process.env.INTERNAL_CRON_SECRET].filter(Boolean).map((secret) => `Bearer ${secret}`);
  if (!allowed.includes(request.headers.get('authorization') ?? '')) {
    return Response.json({ error: 'Not allowed.' }, { status: 401 });
  }

  const { started, finished } = await runDueSchedules();
  after(() => finished);
  return Response.json({ started: started.length });
}
