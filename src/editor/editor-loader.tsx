'use client';

import dynamic from 'next/dynamic';

/**
 * Workflow Builder runs only in the browser (it keeps module-level state and
 * reads browser APIs), so it is loaded without server rendering.
 */
const WorkflowEditor = dynamic(() => import('./workflow-editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

export function EditorLoader(props: { workflowId: string; name: string }) {
  return <WorkflowEditor {...props} />;
}

export function EditorSkeleton() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Opening the editor…</p>
    </div>
  );
}
