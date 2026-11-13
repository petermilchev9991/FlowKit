import type { NodeExecutor } from '@/engine/types';

/**
 * The trigger passes the data that started the run on to the next blocks.
 * The run's input is shaped as { body, source, receivedAt } by src/lib/runs.ts.
 */
export const executeTrigger: NodeExecutor = ({ context }) => ({ output: context.trigger });
