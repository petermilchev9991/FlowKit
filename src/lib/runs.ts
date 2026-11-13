import 'server-only';

import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { type RunTrigger, runs, workflows } from '@/db/schema';
import { runWorkflow } from '@/engine/runner';
import type { Diagram } from '@/engine/types';
import { executors } from '@/nodes/executors';
import { newId } from '@/lib/utils';

import { assertCanRun } from './limits';

type WorkflowRow = typeof workflows.$inferSelect;
type TriggerSource = RunTrigger;

/**
 * Creates a run record and returns its id. Call `executeRun` with the result,
 * either inside `after()` (respond now, run in the background) or awaited
 * (respond with the finished result).
 */
export async function createRun(workflow: WorkflowRow, source: TriggerSource, body: unknown) {
  await assertCanRun(workflow.userId);
  const input = { body: body ?? {}, source, receivedAt: new Date().toISOString() };
  const [row] = await db
    .insert(runs)
    .values({ id: newId('run'), workflowId: workflow.id, userId: workflow.userId, status: 'running', trigger: source, input })
    .returning({ id: runs.id });
  return { runId: row!.id, input };
}

export async function executeRun(workflow: WorkflowRow, runId: string, input: unknown) {
  try {
    const result = await runWorkflow({
      workflowId: workflow.id,
      runId,
      diagram: workflow.diagram as unknown as Diagram,
      input,
      executors,
      // Save progress after each block so the run panel can show it live.
      onStep: async (_step, steps) => {
        await db.update(runs).set({ steps }).where(eq(runs.id, runId));
      },
    });
    await db
      .update(runs)
      .set({ status: result.status, steps: result.steps, error: result.error ?? null, finishedAt: sql`now()` })
      .where(eq(runs.id, runId));
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(runs).set({ status: 'failed', error: message, finishedAt: sql`now()` }).where(eq(runs.id, runId));
    return { status: 'failed' as const, steps: [], error: message };
  }
}

export async function listRuns(userId: string, workflowId: string, limit = 30) {
  await failStaleRuns();
  return db
    .select()
    .from(runs)
    .where(and(eq(runs.workflowId, workflowId), eq(runs.userId, userId)))
    .orderBy(desc(runs.startedAt))
    .limit(limit);
}

/** Runs left in "running" after a crash or redeploy are marked failed. */
export async function failStaleRuns(olderThanMinutes = 15) {
  await db
    .update(runs)
    .set({ status: 'failed', error: 'The run was interrupted (server restarted or timed out).', finishedAt: sql`now()` })
    .where(and(eq(runs.status, 'running'), sql`${runs.startedAt} < now() - make_interval(mins => ${olderThanMinutes})`));
}
