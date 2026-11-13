import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { NodeError } from './types';

/**
 * Blocks requests to private networks (SSRF protection).
 *
 * Without this, any user could make your server call http://localhost,
 * your database, or the cloud metadata service (169.254.169.254) through an
 * HTTP block. Set ALLOW_PRIVATE_HTTP=true only for local testing.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new NodeError(`"${rawUrl}" is not a valid URL. It must start with https:// or http://.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new NodeError('Only http:// and https:// URLs are allowed.');
  }
  if (process.env.ALLOW_PRIVATE_HTTP === 'true') return url;

  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true, verbatim: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new NodeError(`Requests to private or local addresses are blocked (${url.hostname}).`);
  }
  return url;
}

export function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number) as [number, number];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) || // link-local, cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const lower = address.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('::ffff:')) return isPrivateAddress(lower.slice(7));
  return lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
}
