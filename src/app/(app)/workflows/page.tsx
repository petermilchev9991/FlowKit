import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { Badge } from '@/components/ui/badge';
import { getUsage, getUserPlan } from '@/lib/limits';
import { requireUser } from '@/lib/session';
import { formatRelative } from '@/lib/utils';
import { listWorkflows } from '@/lib/workflows';

import { DeleteWorkflowButton, NewWorkflowButton } from './workflow-actions';

export const metadata: Metadata = { title: 'Workflows' };

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Workflows />
    </Suspense>
  );
}

async function Workflows() {
  const user = await requireUser();
  const [workflows, usage, { plan }] = await Promise.all([listWorkflows(user.id), getUsage(user.id), getUserPlan(user.id)]);
  const atLimit = usage.workflows >= plan.limits.workflows;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {usage.runsThisMonth.toLocaleString('en-US')} of {plan.limits.runsPerMonth.toLocaleString('en-US')} runs used this month on the {plan.name} plan.
          </p>
        </div>
        <NewWorkflowButton disabledReason={atLimit ? `Your ${plan.name} plan includes ${plan.limits.workflows} workflows.` : null} />
      </div>

      {workflows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <h2 className="font-semibold">Create your first workflow</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            It starts with a small example you can run right away: it calls an API and checks the result.
          </p>
          <div className="mt-6 flex justify-center">
            <NewWorkflowButton disabledReason={null} />
          </div>
        </div>
      ) : (
        <ul className="mt-8 divide-y rounded-xl border bg-card">
          {workflows.map((workflow) => (
            <li key={workflow.id} className="group flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/workflows/${workflow.id}`} className="font-medium hover:underline hover:underline-offset-4">
                  {workflow.name}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">Edited {formatRelative(workflow.updatedAt)}</p>
              </div>
              <LastRun run={workflow.lastRun} />
              <DeleteWorkflowButton workflowId={workflow.id} name={workflow.name} />
            </li>
          ))}
        </ul>
      )}

      {atLimit && (
        <p className="mt-4 text-sm text-muted-foreground">
          You&apos;re at the {plan.name} plan&apos;s limit.{' '}
          <Link href="/settings" className="font-medium text-foreground underline underline-offset-4">
            Upgrade for unlimited workflows
          </Link>
        </p>
      )}
    </>
  );
}

function LastRun({ run }: { run: { status: string; startedAt: Date } | null }) {
  if (!run) return <span className="hidden text-xs text-muted-foreground sm:inline">Never run</span>;
  const variant = run.status === 'success' ? 'success' : run.status === 'failed' ? 'destructive' : 'warning';
  const label = run.status === 'success' ? 'Succeeded' : run.status === 'failed' ? 'Failed' : 'Running';
  return (
    <span className="hidden items-center gap-2 sm:flex">
      <Badge variant={variant}>{label}</Badge>
      <span className="text-xs text-muted-foreground">{formatRelative(run.startedAt)}</span>
    </span>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden>
      <div className="h-8 w-40 rounded-md bg-muted" />
      <div className="mt-3 h-4 w-72 rounded-md bg-muted" />
      <div className="mt-8 h-48 rounded-xl border bg-card" />
    </div>
  );
}
