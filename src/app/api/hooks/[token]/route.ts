import { after } from 'next/server';

import { json, problem, readJson } from '@/lib/api';
import { LimitError } from '@/lib/limits';
import { createRun, executeRun } from '@/lib/runs';
import { findWorkflowByWebhookToken } from '@/lib/workflows';

export const maxDuration = 300;

/**
 * Public webhook. POST any JSON (or text) to start the workflow; it becomes
 * {{trigger.body}}. The URL itself is the secret, so treat it like a password.
 *
 * By default it answers 202 right away and runs in the background.
 * Add ?wait=true to wait for the run and get its result in the response.
 */
export async function POST(request: Request, context: RouteContext<'/api/hooks/[token]'>) {
  const { token } = await context.params;
  const workflow = await findWorkflowByWebhookToken(token);
  if (!workflow) return problem(404, 'Unknown webhook URL.');

  const body = await readJson(request);
  let run;
  try {
    run = await createRun(workflow, 'webhook', body);
  } catch (error) {
    if (error instanceof LimitError) return problem(429, error.message);
    throw error;
  }

  if (new URL(request.url).searchParams.get('wait') === 'true') {
    const result = await executeRun(workflow, run.runId, run.input);
    const lastOutput = result.steps.filter((step) => step.status === 'success').at(-1)?.output;
    return json({ runId: run.runId, status: result.status, error: result.error, output: lastOutput ?? null }, result.status === 'success' ? 200 : 500);
  }

  after(() => executeRun(workflow, run.runId, run.input));
  return json({ runId: run.runId, status: 'running' }, 202);
}
