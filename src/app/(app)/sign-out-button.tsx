'use client';

import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth-client';

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await signOut();
        // Full reload so no signed-in page stays in the browser cache.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/';
      }}
    >
      Sign out
    </Button>
  );
}
