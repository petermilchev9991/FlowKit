import 'server-only';

import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import { runs, type WorkflowDiagram, workflows } from '@/db/schema';
import { newId, newToken } from '@/lib/utils';

import { assertCanCreateWorkflow } from './limits';
import { computeNextRunAt } from './scheduler';
import { starterDiagram } from './starter-diagram';

/*
 * Data access for workflows. Every function takes the signed-in user's id and
 * only touches that user's rows, so route handlers can't leak other users' data.
 */

export async function listWorkflows(userId: string) {
  const rows = await db
    .select({ id: workflows.id, name: workflows.name, updatedAt: workflows.updatedAt })
    .from(workflows)
    .where(eq(workflows.userId, userId))
    .orderBy(desc(workflows.updatedAt));

  if (rows.length === 0) return [];

  // Latest run per workflow, for the status column.
  const latest = await db
    .selectDistinctOn([runs.workflowId], { workflowId: runs.workflowId, status: runs.status, startedAt: runs.startedAt })
    .from(runs)
    .where(inArray(runs.workflowId, rows.map((row) => row.id)))
    .orderBy(runs.workflowId, desc(runs.startedAt));
  const latestById = new Map(latest.map((run) => [run.workflowId, run]));

  return rows.map((row) => ({ ...row, lastRun: latestById.get(row.id) ?? null }));
}

export async function getWorkflow(userId: string, workflowId: string) {
  const [row] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createWorkflow(userId: string, name = 'Untitled workflow') {
  await assertCanCreateWorkflow(userId);
  const [row] = await db
    .insert(workflows)
    .values({ id: newId('wf'), userId, name, diagram: starterDiagram(), webhookToken: newToken() })
    .returning({ id: workflows.id });
  return row!;
}

export async function saveWorkflow(userId: string, workflowId: string, diagram: WorkflowDiagram) {
  const name = typeof diagram.name === 'string' && diagram.name.trim() ? diagram.name.trim().slice(0, 120) : undefined;
  const [row] = await db
    .update(workflows)
    .set({ diagram, ...(name ? { name } : {}), nextRunAt: computeNextRunAt(diagram), updatedAt: sql`now()` })
    .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
    .returning({ id: workflows.id });
  return row ?? null;
}

export async function renameWorkflow(userId: string, workflowId: string, name: string) {
  const [row] = await db
    .update(workflows)
    .set({ name: name.trim().slice(0, 120) || 'Untitled workflow', updatedAt: sql`now()` })
    .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
    .returning({ id: workflows.id });
  return row ?? null;
}

export async function rotateWebhookToken(userId: string, workflowId: string) {
  const [row] = await db
    .update(workflows)
    .set({ webhookToken: newToken() })
    .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
    .returning({ webhookToken: workflows.webhookToken });
  return row ?? null;
}

export async function deleteWorkflow(userId: string, workflowId: string) {
  const [row] = await db
    .delete(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
    .returning({ id: workflows.id });
  return row ?? null;
}

export async function findWorkflowByWebhookToken(token: string) {
  const [row] = await db.select().from(workflows).where(eq(workflows.webhookToken, token)).limit(1);
  return row ?? null;
}
