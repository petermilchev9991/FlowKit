import { json, problem, withUser } from '@/lib/api';
import { describeWorkflowSchedule } from '@/lib/scheduler';
import { getWorkflow } from '@/lib/workflows';

/** The workflow's schedule and next start time, or null when it has no Schedule block. */
export const GET = withUser<RouteContext<'/api/workflows/[id]/schedule'>>(async (_request, userId, context) => {
  const { id } = await context.params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return problem(404, 'Workflow not found.');
  return json(describeWorkflowSchedule(workflow));
});
