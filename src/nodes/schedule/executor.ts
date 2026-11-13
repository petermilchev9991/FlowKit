import type { NodeExecutor } from '@/engine/types';

/**
 * Like the Trigger, the Schedule block passes on the data that started the run:
 * { scheduledFor, source } for scheduled runs (see src/lib/scheduler.ts), or the
 * manual run's test data. When to run is handled by the scheduler, not here.
 */
export const executeSchedule: NodeExecutor = ({ context }) => ({ output: context.trigger });
