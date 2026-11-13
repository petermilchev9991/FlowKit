import { json, readJson, withUser } from '@/lib/api';
import { createWorkflow, listWorkflows } from '@/lib/workflows';

export const GET = withUser(async (_request, userId) => json(await listWorkflows(userId)));

export const POST = withUser(async (request, userId) => {
  const body = (await readJson(request)) as { name?: unknown };
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : undefined;
  return json(await createWorkflow(userId, name), 201);
});
