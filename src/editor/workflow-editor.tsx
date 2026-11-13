'use client';

import {
  registerComponentDecorator,
  WorkflowBuilder,
  type WorkflowBuilderIntegration,
  type WorkflowBuilderIsValidConnection,
  type WorkflowBuilderPlugin,
  type WorkflowBuilderReactFlowProps,
} from '@workflowbuilder/sdk';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import '@workflowbuilder/sdk/style.css';

import { siteConfig } from '@/config/site';
import { START_NODE_TYPES } from '@/engine/types';
import { paletteItems } from '@/nodes/editor';

import { useRunStore } from './run-store';
import { runStatusPlugin } from './run-status-plugin';
import { RunControls, RunsPanel } from './runs-panel';
import { ThemeSync } from './theme-sync';

/** Adds the Run and Runs buttons to the editor's top bar. */
const runControlsPlugin: WorkflowBuilderPlugin = () => {
  registerComponentDecorator('OptionalAppBarControls', { content: RunControls, place: 'before', name: 'RunControls' });
};

// Module-level constants: the SDK needs stable references for these.
const plugins: WorkflowBuilderPlugin[] = [runControlsPlugin, runStatusPlugin];

// Blocks snap to a 20px grid, so blocks in the same row line up and the
// lines between them stay straight.
const reactFlowProps: WorkflowBuilderReactFlowProps = { snapToGrid: true, snapGrid: [20, 20] };

// Start blocks (Trigger, Schedule) begin the workflow, so nothing may connect into them.
const isValidConnection: WorkflowBuilderIsValidConnection = ({ targetNode }) =>
  !START_NODE_TYPES.includes(String(targetNode.data.type));

/**
 * The visual editor. Loads and saves through /api/workflows/[id]/diagram, and
 * adds Run controls, a Runs panel and per-block run results on top of Workflow
 * Builder's default layout. Rendered client-side only (see editor-loader.tsx).
 */
export default function WorkflowEditor({ workflowId, name }: { workflowId: string; name: string }) {
  const isReady = useRunStore((state) => state.workflowId === workflowId);
  const setWorkflowId = useRunStore((state) => state.setWorkflowId);
  useEffect(() => setWorkflowId(workflowId), [workflowId, setWorkflowId]);

  const integration = useMemo<WorkflowBuilderIntegration>(
    () => ({
      strategy: 'api',
      endpoints: {
        load: `/api/workflows/${workflowId}/diagram`,
        save: `/api/workflows/${workflowId}/diagram`,
      },
    }),
    [workflowId],
  );

  if (!isReady) return null;

  return (
    <div className="editor-host relative h-dvh w-full overflow-hidden">
      <WorkflowBuilder.Root
        name={name}
        nodeTypes={paletteItems}
        integration={integration}
        isValidConnection={isValidConnection}
        plugins={plugins}
        reactFlowProps={reactFlowProps}
        logo={<BackToWorkflows />}
      >
        <WorkflowBuilder.DefaultLayout />
        <RunsPanel />
        <ThemeSync />
      </WorkflowBuilder.Root>
    </div>
  );
}

function BackToWorkflows() {
  return (
    <Link
      href="/workflows"
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] font-semibold whitespace-nowrap text-inherit no-underline hover:bg-zinc-900/5"
      title="Back to all workflows"
    >
      <ArrowLeft className="size-4" />
      {siteConfig.name}
    </Link>
  );
}
