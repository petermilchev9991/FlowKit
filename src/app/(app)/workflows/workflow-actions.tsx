'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function NewWorkflowButton({ disabledReason }: { disabledReason: string | null }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setIsPending(true);
    setError(null);
    const response = await fetch('/api/workflows', { method: 'POST' });
    const body = (await response.json()) as { id?: string; error?: string };
    if (!response.ok || !body.id) {
      setError(body.error ?? 'Could not create the workflow.');
      setIsPending(false);
      return;
    }
    router.push(`/workflows/${body.id}`);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={create} disabled={isPending || disabledReason !== null} title={disabledReason ?? undefined}>
        {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
        New workflow
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function DeleteWorkflowButton({ workflowId, name }: { workflowId: string; name: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function remove() {
    if (!confirm(`Delete "${name}" and its run history? This can't be undone.`)) return;
    setIsPending(true);
    await fetch(`/api/workflows/${workflowId}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={remove}
      disabled={isPending}
      aria-label={`Delete ${name}`}
      className="text-muted-foreground opacity-60 group-hover:opacity-100 hover:text-destructive"
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
