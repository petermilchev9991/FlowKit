import { type NodeExecutor, NodeError } from '@/engine/types';

type Properties = { to?: string; subject?: string; body?: string; replyTo?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends a plain-text email through Resend (resend.com). Set RESEND_API_KEY and
 * EMAIL_FROM (an address on a domain you verified in Resend). To use another
 * provider, replace the fetch call below; the block's fields stay the same.
 */
export const executeSendEmail: NodeExecutor<Properties> = async ({ properties, resolve, context }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new NodeError('Email is not set up. Add RESEND_API_KEY and EMAIL_FROM to the server environment.');

  const to = resolve(properties.to ?? '').split(',').map((address) => address.trim()).filter(Boolean);
  if (to.length === 0) throw new NodeError('Enter who to send the email to.');
  if (to.length > 20) throw new NodeError('Send to at most 20 addresses at once.');
  const invalid = to.find((address) => !EMAIL.test(address));
  if (invalid) throw new NodeError(`"${invalid}" is not an email address.`);

  const subject = resolve(properties.subject ?? '').trim();
  const text = resolve(properties.body ?? '');
  if (!subject) throw new NodeError('Write a subject.');
  if (!text.trim()) throw new NodeError('Write a message.');
  const replyTo = resolve(properties.replyTo ?? '').trim();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to, subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.any([context.signal, AbortSignal.timeout(30_000)]),
  });
  const data = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok) throw new NodeError(`The email provider returned ${response.status}: ${data?.message ?? 'no details'}`);
  return { output: { id: data?.id ?? null, to: to.join(', ') } };
};
