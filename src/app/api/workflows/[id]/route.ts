import { json, problem, readJson, withUser } from '@/lib/api';
import { deleteWorkflow, getWorkflow, renameWorkflow } from '@/lib/workflows';

type Context = RouteContext<'/api/workflows/[id]'>;

export const GET = withUser<Context>(async (_request, userId, context) => {
  const { id } = await context.params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return problem(404, 'Workflow not found.');
  return json({ id: workflow.id, name: workflow.name, diagram: workflow.diagram, updatedAt: workflow.updatedAt });
});

export const PATCH = withUser<Context>(async (request, userId, context) => {
  const { id } = await context.params;
  const body = (await readJson(request)) as { name?: unknown };
  if (typeof body.name !== 'string') return problem(400, 'Send a name.');
  const renamed = await renameWorkflow(userId, id, body.name);
  if (!renamed) return problem(404, 'Workflow not found.');
  return json({ ok: true });
});

export const DELETE = withUser<Context>(async (_request, userId, context) => {
  const { id } = await context.params;
  const deleted = await deleteWorkflow(userId, id);
  if (!deleted) return problem(404, 'Workflow not found.');
  return json({ ok: true });
});
