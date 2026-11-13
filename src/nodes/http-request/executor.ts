import { assertPublicUrl } from '@/engine/safe-fetch';
import { type NodeExecutor, NodeError } from '@/engine/types';

type Properties = {
  method?: string;
  url?: string;
  headers?: string;
  body?: string;
};

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 2_000_000;

export const executeHttpRequest: NodeExecutor<Properties> = async ({ properties, resolve, context }) => {
  const method = (properties.method ?? 'GET').toUpperCase();
  const rawUrl = resolve(properties.url ?? '').trim();
  if (!rawUrl) throw new NodeError('Enter a URL.');

  const headers = parseHeaders(resolve(properties.headers ?? ''));
  const body = method === 'GET' || method === 'DELETE' ? undefined : resolve(properties.body ?? '') || undefined;
  if (body && !hasHeader(headers, 'content-type')) {
    headers.set('content-type', looksLikeJson(body) ? 'application/json' : 'text/plain');
  }

  const signal = AbortSignal.any([context.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);

  // Follow redirects by hand so every hop is checked against private addresses.
  let url = await assertPublicUrl(rawUrl);
  let response: Response;
  for (let hop = 0; ; hop++) {
    response = await fetch(url, { method, headers, body, signal, redirect: 'manual' }).catch((error: unknown) => {
      throw new NodeError(describeNetworkError(error, url));
    });
    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) break;
    if (hop >= MAX_REDIRECTS) throw new NodeError('Too many redirects.');
    url = await assertPublicUrl(new URL(location, url).toString());
  }

  const text = await readLimited(response, MAX_RESPONSE_BYTES);
  return {
    output: {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      body: parseBody(text, response.headers.get('content-type')),
    },
  };
};

function describeNetworkError(error: unknown, url: URL) {
  const cause = (error as { cause?: { code?: string } })?.cause;
  if ((error as Error)?.name === 'TimeoutError') return `${url.hostname} did not answer within ${REQUEST_TIMEOUT_MS / 1000} seconds.`;
  switch (cause?.code) {
    case 'ENOTFOUND':
      return `Could not find ${url.hostname}. Check the address.`;
    case 'ECONNREFUSED':
      return `${url.hostname} refused the connection.`;
    case 'ECONNRESET':
      return `${url.hostname} closed the connection.`;
    case 'CERT_HAS_EXPIRED':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
      return `${url.hostname} has an invalid HTTPS certificate.`;
    default:
      return `Could not reach ${url.hostname}${cause?.code ? ` (${cause.code})` : ''}.`;
  }
}

function parseHeaders(text: string) {
  const headers = new Headers();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(':');
    if (separator <= 0) throw new NodeError(`Header "${trimmed}" must look like "Name: value".`);
    headers.append(trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim());
  }
  return headers;
}

function hasHeader(headers: Headers, name: string) {
  return headers.has(name);
}

function looksLikeJson(text: string) {
  const first = text.trimStart()[0];
  return first === '{' || first === '[';
}

function parseBody(text: string, contentType: string | null) {
  if (contentType?.includes('json') || looksLikeJson(text)) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

async function readLimited(response: Response, maxBytes: number) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new NodeError(`The response is larger than ${Math.round(maxBytes / 1_000_000)} MB.`);
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
