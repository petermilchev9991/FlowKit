import { assertPublicUrl } from '@/engine/safe-fetch';
import { type NodeExecutor, NodeError } from '@/engine/types';

type Properties = { webhookUrl?: string; message?: string };

/**
 * Posts a message to a chat channel through an incoming webhook. Slack and
 * Discord are detected from the URL; anything else receives { "text": ... },
 * which Microsoft Teams, Mattermost and many others also accept.
 */
export const executeChatMessage: NodeExecutor<Properties> = async ({ properties, resolve, context }) => {
  const rawUrl = resolve(properties.webhookUrl ?? '').trim();
  if (!rawUrl) throw new NodeError('Paste the channel webhook URL.');
  const message = resolve(properties.message ?? '').trim();
  if (!message) throw new NodeError('Write a message.');

  const url = await assertPublicUrl(rawUrl);
  const service = url.hostname === 'hooks.slack.com' ? 'slack' : /(^|\.)discord(app)?\.com$/.test(url.hostname) ? 'discord' : 'other';
  // Discord limits messages to 2000 characters.
  const body = service === 'discord' ? { content: message.slice(0, 2000) } : { text: message };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.any([context.signal, AbortSignal.timeout(20_000)]),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 200);
    throw new NodeError(`The chat service returned ${response.status}${detail ? `: ${detail}` : ''}.`);
  }
  return { output: { ok: true, service } };
};
