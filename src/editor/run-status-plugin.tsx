'use client';

import { registerComponentDecorator, type WorkflowBuilderPlugin } from '@workflowbuilder/sdk';

import { cn } from '@/lib/utils';

import { useRunStore } from './run-store';

/**
 * Shows the result of the selected run on each block in the canvas:
 * a green "Done", a red "Failed" or a grey "Skipped" line under the block.
 * Slot content receives the slot's props wrapped in `props`.
 */
function RunStatusChip({ props: { nodeId } }: { props: { nodeId: string } }) {
  const step = useRunStore((state) =>
    state.runs.find((run) => run.id === state.selectedRunId)?.steps.find((item) => item.nodeId === nodeId),
  );
  const isRunning = useRunStore(
    (state) => state.runs.find((run) => run.id === state.selectedRunId)?.status === 'running',
  );
  if (!step) {
    return isRunning ? <Chip tone="waiting">Waiting</Chip> : null;
  }
  if (step.status === 'success') return <Chip tone="success">Done in {formatMs(step.durationMs)}</Chip>;
  if (step.status === 'failed') return <Chip tone="failed" title={step.error}>Failed: {step.error}</Chip>;
  return <Chip tone="skipped">Skipped</Chip>;
}

function Chip({ tone, children, title }: { tone: 'success' | 'failed' | 'skipped' | 'waiting'; children: React.ReactNode; title?: string }) {
  return (
    <div
      title={title}
      className={cn(
        'mt-2 flex max-w-[260px] items-center gap-1.5 truncate rounded-md px-2 py-1 text-[11px] font-medium',
        tone === 'success' && 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        tone === 'failed' && 'bg-red-500/12 text-red-700 dark:text-red-300',
        tone === 'skipped' && 'bg-muted text-muted-foreground',
        tone === 'waiting' && 'animate-pulse bg-amber-500/12 text-amber-700 dark:text-amber-300',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          tone === 'success' && 'bg-emerald-500',
          tone === 'failed' && 'bg-red-500',
          tone === 'skipped' && 'bg-muted-foreground/50',
          tone === 'waiting' && 'bg-amber-500',
        )}
      />
      <span className="truncate">{children}</span>
    </div>
  );
}

function formatMs(ms: number) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export const runStatusPlugin: WorkflowBuilderPlugin = () => {
  registerComponentDecorator('OptionalNodeContent', {
    content: RunStatusChip,
    place: 'after',
    name: 'RunStatus',
  });
};
