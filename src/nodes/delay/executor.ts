import { type NodeExecutor, NodeError } from '@/engine/types';

/**
 * In-request waits are capped at 60 seconds so runs fit inside a serverless
 * function. For waits of hours or days, run workflows on a job queue
 * (see "Long-running workflows" in the README).
 */
const MAX_SECONDS = 60;

export const executeDelay: NodeExecutor<{ seconds?: number | string }> = async ({ properties, context }) => {
  const seconds = Number(properties.seconds ?? 0);
  if (!Number.isFinite(seconds) || seconds < 0) throw new NodeError('Enter the number of seconds to wait.');
  if (seconds > MAX_SECONDS) throw new NodeError(`Delays can be at most ${MAX_SECONDS} seconds.`);

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, seconds * 1000);
    context.signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new NodeError('The run was stopped while waiting.'));
    });
  });
  return { output: { waitedSeconds: seconds } };
};
