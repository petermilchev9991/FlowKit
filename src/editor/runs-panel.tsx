'use client';

import { useWorkflowBuilderActions } from '@workflowbuilder/sdk';
import { Check, ChevronRight, Copy, History, Loader2, Play, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { cn, formatRelative } from '@/lib/utils';

import { type RunSummary, useRunStore } from './run-store';

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

function useRunsPolling(workflowId: string) {
  const { isPanelOpen, runs, setRuns } = useRunStore();
  const hasActiveRun = runs.some((run) => run.status === 'running');

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/workflows/${workflowId}/runs`);
    if (response.ok) setRuns((await response.json()) as RunSummary[]);
  }, [workflowId, setRuns]);

  useEffect(() => {
    if (isPanelOpen) void refresh();
  }, [isPanelOpen, refresh]);

  useEffect(() => {
    if (!hasActiveRun) return;
    const timer = setInterval(() => void refresh(), 1200);
    return () => clearInterval(timer);
  }, [hasActiveRun, refresh]);

  return refresh;
}

/* -------------------------------------------------------------------------- */
/*  Header controls: Run + Runs                                                */
/* -------------------------------------------------------------------------- */

export function RunControls() {
  const { save } = useWorkflowBuilderActions();
  const { workflowId, isPanelOpen, setPanelOpen, selectRun, setRuns, runs } = useRunStore();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useRunsPolling(workflowId);

  async function run() {
    setIsStarting(true);
    setError(null);
    try {
      // Run what's on screen: save first so the server has the latest version.
      const saved = await save();
      if (saved === 'error') throw new Error('Could not save the workflow before running it.');
      const input = readTestInput(workflowId);
      const response = await fetch(`/api/workflows/${workflowId}/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = (await response.json()) as { runId?: string; error?: string };
      if (!response.ok || !body.runId) throw new Error(body.error ?? 'The run could not start.');
      const placeholder: RunSummary = {
        id: body.runId,
        status: 'running',
        trigger: 'manual',
        steps: [],
        error: null,
        startedAt: new Date().toISOString(),
        finishedAt: null,
      };
      setRuns([placeholder, ...runs]);
      selectRun(body.runId);
      setPanelOpen(true);
      void refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setPanelOpen(true);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setPanelOpen(!isPanelOpen)}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-foreground/80 hover:bg-muted',
          isPanelOpen && 'bg-muted',
        )}
      >
        <History className="size-4" />
        Runs
      </button>
      <button
        type="button"
        onClick={run}
        disabled={isStarting}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-cobalt px-3 text-[13px] font-semibold text-white shadow-xs hover:bg-cobalt/90 disabled:opacity-60"
      >
        {isStarting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-3.5 fill-current" />}
        Run
      </button>
      {error && <RunErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}

function RunErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div role="alert" className="fixed top-20 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-start gap-3 rounded-lg bg-inverse px-4 py-3 text-sm text-inverse-foreground shadow-lg">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Side panel                                                                 */
/* -------------------------------------------------------------------------- */

const testInputKey = (workflowId: string) => `test-input:${workflowId}`;

function readTestInput(workflowId: string): unknown {
  try {
    const raw = localStorage.getItem(testInputKey(workflowId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function RunsPanel() {
  const { workflowId, isPanelOpen, setPanelOpen, runs, selectedRunId, selectRun } = useRunStore();
  if (!isPanelOpen) return null;

  return (
    <aside
      aria-label="Runs"
      className="fixed top-[72px] right-4 bottom-4 z-40 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Runs</h2>
        <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close runs" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <ScheduleInfo workflowId={workflowId} />
        <TestInput workflowId={workflowId} />
        <WebhookUrl workflowId={workflowId} />

        <ol className="divide-y divide-border border-t border-border">
          {runs.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">No runs yet. Press Run to try the workflow.</li>
          )}
          {runs.map((run) => (
            <RunRow key={run.id} run={run} isSelected={run.id === selectedRunId} onSelect={() => selectRun(run.id === selectedRunId ? null : run.id)} />
          ))}
        </ol>
      </div>
    </aside>
  );
}

const triggerLabels: Record<string, string> = { manual: 'Manual', webhook: 'Webhook', schedule: 'Scheduled' };

function RunRow({ run, isSelected, onSelect }: { run: RunSummary; isSelected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button type="button" onClick={onSelect} aria-expanded={isSelected} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60">
        <StatusDot status={run.status} />
        <span className="flex-1">
          <span className="block text-sm font-medium">
            {run.status === 'running' ? 'Running' : run.status === 'success' ? 'Succeeded' : 'Failed'}
          </span>
          <span className="block text-xs text-muted-foreground">
            {triggerLabels[run.trigger] ?? 'Manual'}, {formatRelative(run.startedAt)}
          </span>
        </span>
        <ChevronRight className={cn('size-4 text-muted-foreground transition-transform', isSelected && 'rotate-90')} />
      </button>
      {isSelected && (
        <div className="space-y-2 bg-muted/50 px-4 pt-1 pb-4">
          {run.error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{run.error}</p>}
          {run.steps.map((step, index) => (
            <details key={`${step.nodeId}-${index}`} className="group rounded-md border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs">
                <StatusDot status={step.status} />
                <span className="flex-1 font-medium">{step.label}</span>
                <span className="text-muted-foreground">{step.status === 'skipped' ? 'skipped' : `${step.durationMs} ms`}</span>
              </summary>
              <pre className="max-h-64 overflow-auto border-t border-border px-3 py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80">
                {step.error ?? JSON.stringify(step.output ?? null, null, 2)}
              </pre>
            </details>
          ))}
          {run.status === 'running' && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Working…
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-2 shrink-0 rounded-full',
        status === 'success' && 'bg-mint',
        status === 'failed' && 'bg-red-500',
        status === 'running' && 'animate-pulse bg-amber-500',
        status === 'skipped' && 'bg-muted-foreground/40',
      )}
    />
  );
}

function TestInput({ workflowId }: { workflowId: string }) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(testInputKey(workflowId)) ?? '{\n  \n}';
    } catch {
      return '{\n  \n}';
    }
  });
  const isValid = (() => {
    try {
      JSON.parse(value || '{}');
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <label className="block px-4 pt-4 pb-3">
      <span className="text-xs font-medium text-foreground/80">Test data for manual runs</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">JSON that later blocks read as {'{{trigger.body}}'}</span>
      <textarea
        value={value}
        spellCheck={false}
        rows={4}
        onChange={(event) => {
          setValue(event.target.value);
          try {
            localStorage.setItem(testInputKey(workflowId), event.target.value);
          } catch {
            // Storage unavailable: the value still works for this session.
          }
        }}
        className={cn(
          'mt-2 w-full resize-y rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs outline-none focus:border-cobalt',
          !isValid && 'border-destructive',
        )}
      />
      {!isValid && <span className="text-xs text-destructive">This isn&apos;t valid JSON yet.</span>}
    </label>
  );
}

type ScheduleInfoData = { description: string | null; problem: string | null; nextRunAt: string | null } | null;

/** Shown when the workflow starts with a Schedule block. */
function ScheduleInfo({ workflowId }: { workflowId: string }) {
  const [info, setInfo] = useState<ScheduleInfoData>(null);
  const runs = useRunStore((state) => state.runs);

  // Refresh whenever the run list changes (a save happens before every run).
  useEffect(() => {
    void fetch(`/api/workflows/${workflowId}/schedule`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: ScheduleInfoData) => setInfo(body));
  }, [workflowId, runs.length]);

  if (!info) return null;
  return (
    <div className="mx-4 mt-4 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-xs">
      <p className="font-medium text-foreground/80">Schedule</p>
      {info.problem ? (
        <p className="mt-0.5 text-destructive">{info.problem}</p>
      ) : (
        <p className="mt-0.5 text-muted-foreground">
          {info.description}
          {info.nextRunAt ? `. Next run ${new Date(info.nextRunAt).toLocaleString()}.` : '. Save the workflow to start it.'}
        </p>
      )}
    </div>
  );
}

function WebhookUrl({ workflowId }: { workflowId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void fetch(`/api/workflows/${workflowId}/webhook`)
      .then((response) => response.json())
      .then((body: { url?: string }) => setUrl(body.url ?? null));
  }, [workflowId]);

  async function rotate() {
    if (!confirm('Replace the webhook URL? Anything using the current URL will stop working.')) return;
    const response = await fetch(`/api/workflows/${workflowId}/webhook`, { method: 'POST' });
    const body = (await response.json()) as { url?: string };
    setUrl(body.url ?? null);
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="px-4 pb-4">
      <span className="text-xs font-medium text-foreground/80">Webhook URL</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">POST JSON here to run the workflow. Keep it secret.</span>
      <div className="mt-2 flex items-center gap-1">
        <code className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono text-[11px] text-foreground/80">{url ?? 'Loading…'}</code>
        <button type="button" onClick={copy} aria-label="Copy webhook URL" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
          {copied ? <Check className="size-3.5 text-success-foreground" /> : <Copy className="size-3.5" />}
        </button>
        <button type="button" onClick={rotate} aria-label="Replace webhook URL" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
          <RefreshCw className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
