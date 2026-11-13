import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/session';

/**
 * Header actions on public pages: "Sign in" and "Start free" for visitors,
 * "Open your workflows" for someone already signed in. The page itself stays
 * static; only this part is rendered per request.
 */
export function HeaderAuthLinks() {
  return (
    <Suspense fallback={<SignedOutLinks />}>
      <AuthLinks />
    </Suspense>
  );
}

async function AuthLinks() {
  const user = await getCurrentUser();
  if (!user) return <SignedOutLinks />;
  return (
    <Button asChild size="sm" className="ml-2">
      <Link href="/workflows">Open your workflows</Link>
    </Button>
  );
}

function SignedOutLinks() {
  return (
    <>
      <Link href="/sign-in" className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground">
        Sign in
      </Link>
      <Button asChild size="sm" className="ml-2">
        <Link href="/sign-up">Start free</Link>
      </Button>
    </>
  );
}
