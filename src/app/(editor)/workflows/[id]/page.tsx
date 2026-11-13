import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { EditorLoader, EditorSkeleton } from '@/editor/editor-loader';
import { requireUser } from '@/lib/session';
import { getWorkflow } from '@/lib/workflows';

export default function WorkflowEditorPage(props: PageProps<'/workflows/[id]'>) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Editor params={props.params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<'/workflows/[id]'>['params'] }) {
  const user = await requireUser();
  const { id } = await params;
  const workflow = await getWorkflow(user.id, id);
  if (!workflow) notFound();
  return <EditorLoader workflowId={workflow.id} name={workflow.name} />;
}
