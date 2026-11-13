import 'server-only';

import { LimitError } from './limits';
import { getUserIdFromRequest } from './session';

/** Small helpers so every route handler answers errors the same way. */

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function problem(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/**
 * Wraps a route handler that needs a signed-in user. Turns plan-limit errors
 * into 402 responses and unexpected errors into 500s.
 */
export function withUser<C>(handler: (request: Request, userId: string, context: C) => Promise<Response>) {
  return async (request: Request, context: C) => {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return problem(401, 'Sign in to continue.');
    try {
      return await handler(request, userId, context);
    } catch (error) {
      if (error instanceof LimitError) return problem(402, error.message);
      console.error(error);
      return problem(500, 'Something went wrong on the server. Try again.');
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
