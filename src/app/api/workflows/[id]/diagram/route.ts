import { z } from 'zod';

import { json, problem, readJson, withUser } from '@/lib/api';
import { getWorkflow, saveWorkflow } from '@/lib/workflows';

/**
 * Load and save endpoints for the editor (Workflow Builder's `api` integration
 * strategy): GET returns the diagram, POST receives it from the save button
 * and autosave.
 */
type Context = RouteContext<'/api/workflows/[id]/diagram'>;

export const GET = withUser<Context>(async (_request, userId, context) => {
  const { id } = await context.params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return problem(404, 'Workflow not found.');
  return json({ ...workflow.diagram, name: workflow.name });
});

const diagramSchema = z.object({
  name: z.string().max(200).optional(),
  layoutDirection: z.enum(['DOWN', 'RIGHT']).optional(),
  globalVariables: z.record(z.string(), z.unknown()).optional(),
  nodes: z.array(z.object({ id: z.string(), data: z.object({ type: z.string() }).passthrough() }).passthrough()).max(500),
  edges: z.array(z.object({ id: z.string(), source: z.string(), target: z.string() }).passthrough()).max(2000),
});

export const POST = withUser<Context>(async (request, userId, context) => {
  const { id } = await context.params;
  const parsed = diagramSchema.safeParse(await readJson(request));
  if (!parsed.success) return problem(400, 'The workflow data is not valid.');
  const saved = await saveWorkflow(userId, id, parsed.data);
  if (!saved) return problem(404, 'Workflow not found.');
  return json({ ok: true });
});
