'use client';

import { create } from 'zustand';

import type { RunStep } from '@/db/schema';

export type RunSummary = {
  id: string;
  status: 'running' | 'success' | 'failed';
  trigger: 'manual' | 'webhook' | 'schedule';
  steps: RunStep[];
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type RunState = {
  /** The workflow open in the editor. */
  workflowId: string;
  isPanelOpen: boolean;
  runs: RunSummary[];
  /** The run whose results are shown on the canvas. */
  selectedRunId: string | null;
  setWorkflowId: (workflowId: string) => void;
  setPanelOpen: (open: boolean) => void;
  setRuns: (runs: RunSummary[]) => void;
  selectRun: (runId: string | null) => void;
};

export const useRunStore = create<RunState>((set) => ({
  workflowId: '',
  isPanelOpen: false,
  runs: [],
  selectedRunId: null,
  // Opening another workflow starts with a clean slate.
  setWorkflowId: (workflowId) => set({ workflowId, runs: [], selectedRunId: null, isPanelOpen: false }),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setRuns: (runs) => set({ runs }),
  selectRun: (selectedRunId) => set({ selectedRunId }),
}));

export function useSelectedRun() {
  return useRunStore((state) => state.runs.find((run) => run.id === state.selectedRunId) ?? null);
}
