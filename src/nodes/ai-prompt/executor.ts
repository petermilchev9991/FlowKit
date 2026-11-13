import { type NodeExecutor, NodeError } from '@/engine/types';

type Properties = { instructions?: string; prompt?: string; model?: string };

/**
 * Calls any OpenAI-compatible chat completions API (OpenAI, OpenRouter, Groq,
 * Together, a local Ollama...). Configure it with AI_API_KEY, AI_BASE_URL and
 * AI_MODEL in .env. The key stays on the server.
 */
export const executeAiPrompt: NodeExecutor<Properties> = async ({ properties, resolve, context }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new NodeError('AI is not set up. Add AI_API_KEY to the server environment.');

  const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = properties.model?.trim() || process.env.AI_MODEL || 'gpt-4o-mini';
  const prompt = resolve(properties.prompt ?? '').trim();
  if (!prompt) throw new NodeError('Write a prompt.');

  const messages = [
    ...(properties.instructions?.trim() ? [{ role: 'system', content: properties.instructions.trim() }] : []),
    { role: 'user', content: prompt },
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
    signal: AbortSignal.any([context.signal, AbortSignal.timeout(120_000)]),
  });

  const data = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new NodeError(`The AI provider returned ${response.status}: ${data?.error?.message ?? 'no details'}`);
  }
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') throw new NodeError('The AI provider returned an empty answer.');
  return { output: { text, model: data?.model ?? model } };
};
