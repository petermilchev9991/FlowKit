import { json, withUser } from '@/lib/api';
import { listRuns } from '@/lib/runs';

/** Recent runs of one workflow, newest first. The editor polls this while a run is in progress. */
export const GET = withUser<RouteContext<'/api/workflows/[id]/runs'>>(async (_request, userId, context) => {
  const { id } = await context.params;
  return json(await listRuns(userId, id));
});
