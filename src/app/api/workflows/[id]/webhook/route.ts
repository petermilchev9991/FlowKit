import { siteConfig } from '@/config/site';
import { json, problem, withUser } from '@/lib/api';
import { getWorkflow, rotateWebhookToken } from '@/lib/workflows';

type Context = RouteContext<'/api/workflows/[id]/webhook'>;

const webhookUrl = (token: string) => `${siteConfig.url.replace(/\/$/, '')}/api/hooks/${token}`;

/** The workflow's public webhook URL. */
export const GET = withUser<Context>(async (_request, userId, context) => {
  const { id } = await context.params;
  const workflow = await getWorkflow(userId, id);
  if (!workflow) return problem(404, 'Workflow not found.');
  return json({ url: webhookUrl(workflow.webhookToken) });
});

/** Replaces the webhook URL. The old URL stops working immediately. */
export const POST = withUser<Context>(async (_request, userId, context) => {
  const { id } = await context.params;
  const rotated = await rotateWebhookToken(userId, id);
  if (!rotated) return problem(404, 'Workflow not found.');
  return json({ url: webhookUrl(rotated.webhookToken) });
});
