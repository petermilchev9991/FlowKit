/**
 * Runs once when the server starts. When the app runs as a long-lived Node.js
 * server (`npm run dev`, `npm start`, Docker...), this starts a timer that
 * checks for due scheduled workflows every minute.
 *
 * On Vercel and other serverless hosts there is no long-lived process, so a
 * cron job must call /api/cron/tick instead (see "Schedules" in the README).
 * Set SCHEDULER=external to turn the timer off elsewhere too.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.VERCEL || process.env.SCHEDULER === 'external') return;

  const globalScheduler = globalThis as unknown as { schedulerStarted?: boolean };
  if (globalScheduler.schedulerStarted) return; // already running (dev reloads)
  globalScheduler.schedulerStarted = true;

  // A secret only this process knows, so the timer can call the protected endpoint.
  process.env.INTERNAL_CRON_SECRET ??= crypto.randomUUID() + crypto.randomUUID();

  const port = process.env.PORT ?? '3000';
  const tick = async () => {
    try {
      await fetch(`http://127.0.0.1:${port}/api/cron/tick`, {
        headers: { authorization: `Bearer ${process.env.INTERNAL_CRON_SECRET}` },
        signal: AbortSignal.timeout(55_000),
      });
    } catch {
      // The server may still be starting or restarting; the next tick tries again.
    }
  };

  // Line ticks up with the start of each minute, so "09:00" starts close to 09:00:00.
  const delay = 60_000 - (Date.now() % 60_000) + 1_000;
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), 60_000);
  }, delay);
}
