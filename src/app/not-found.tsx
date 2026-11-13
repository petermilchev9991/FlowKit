import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">This page doesn&apos;t exist</h1>
      <p className="text-muted-foreground">The link may be old, or the workflow was deleted.</p>
      <Button asChild>
        <Link href="/workflows">Go to your workflows</Link>
      </Button>
    </div>
  );
}
