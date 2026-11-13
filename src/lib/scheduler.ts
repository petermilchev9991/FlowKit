import 'server-only';

import { and, eq, isNotNull, lte } from 'drizzle-orm';

import { db } from '@/db';
import { type WorkflowDiagram, workflows } from '@/db/schema';
import { describeSchedule, nextRunAfter, type ScheduleSettings, validateSchedule } from '@/engine/schedule-time';
import type { DiagramNode } from '@/engine/types';

import { LimitError } from './limits';
import { createRun, executeRun } from './runs';

/**
 * Starts workflows whose Schedule block is due.
 *
 * Each workflow stores its next start time in `next_run_at`, recalculated
 * whenever it's saved and after every scheduled start. `runDueSchedules`
 * claims due workflows one by one (so two servers never start the same run
 * twice) and starts them.
 *
 * Something must call `runDueSchedules` every minute:
 *  - On your own server (`npm start`, Docker...): src/instrumentation.ts does it.
 *  - On Vercel or other serverless hosts: a cron job calls /api/cron/tick.
 */

/** The active Schedule block's settings, or null when the workflow has none. */
export function findSchedule(diagram: WorkflowDiagram): ScheduleSettings | null {
  const node = (diagram.nodes as DiagramNode[]).find((item) => item?.data?.type === 'schedule');
  if (!node) return null;
  const status = node.data.properties?.status;
  if (status === 'disabled' || status === 'draft') return null;
  return (node.data.properties ?? {}) as ScheduleSettings;
}

/** Next start time for a diagram, or null when it has no valid, active schedule. */
export function computeNextRunAt(diagram: WorkflowDiagram, after = new Date()): Date | null {
  const schedule = findSchedule(diagram);
  if (!schedule || validateSchedule(schedule)) return null;
  return nextRunAfter(schedule, after);
}

const BATCH_SIZE = 25;

export async function runDueSchedules(now = new Date()) {
  const due = await db
    .select()
    .from(workflows)
    .where(and(isNotNull(workflows.nextRunAt), lte(workflows.nextRunAt, now)))
    .orderBy(workflows.nextRunAt)
    .limit(BATCH_SIZE);

  const started: string[] = [];
  const runs: Array<Promise<unknown>> = [];

  for (const workflow of due) {
    const scheduledFor = workflow.nextRunAt!;
    const next = computeNextRunAt(workflow.diagram, now);

    // Claim it: only the process that moves next_run_at forward starts the run.
    const [claimed] = await db
      .update(workflows)
      .set({ nextRunAt: next })
      .where(and(eq(workflows.id, workflow.id), eq(workflows.nextRunAt, scheduledFor)))
      .returning({ id: workflows.id });
    if (!claimed || !findSchedule(workflow.diagram)) continue;

    try {
      const { runId, input } = await createRun(workflow, 'schedule', { scheduledFor: scheduledFor.toISOString() });
      started.push(runId);
      runs.push(executeRun(workflow, runId, input));
    } catch (error) {
      if (error instanceof LimitError) continue; // over the plan's monthly runs: skip this one
      console.error(`Scheduled run of ${workflow.id} failed to start:`, error);
    }
  }

  return { started, finished: Promise.allSettled(runs) };
}

/** What the editor shows about a workflow's schedule. */
export function describeWorkflowSchedule(workflow: { diagram: WorkflowDiagram; nextRunAt: Date | null }) {
  const schedule = findSchedule(workflow.diagram);
  if (!schedule) return null;
  const problem = validateSchedule(schedule);
  return {
    description: problem ? null : describeSchedule(schedule),
    problem,
    nextRunAt: workflow.nextRunAt?.toISOString() ?? null,
  };
}
