import { after } from 'next/server';

import { json, problem, readJson, withUser } from '@/lib/api';
import { createRun, executeRun } from '@/lib/runs';
import { getWorkflow } from '@/lib/workflows';

// Runs continue after the response is sent; this is how long they may take.
export const maxDuration = 300;

/** Starts a manual run. The optional JSON body becomes {{trigger.body}}. */
export const POST = withUser<RouteContext<'/api/workflows/[id]/run'>>(async (request, userId, context) => {
  const { id } = await context.params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return problem(404, 'Workflow not found.');

  const { runId, input } = await createRun(workflow, 'manual', await readJson(request));
  after(() => executeRun(workflow, runId, input));
  return json({ runId }, 202);
});
