import Link from 'next/link';
import { Suspense } from 'react';

import { BrandMark } from '@/components/brand-mark';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getCurrentUser } from '@/lib/session';

import { SignOutButton } from './sign-out-button';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
          <BrandMark href="/workflows" />
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/workflows" className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Workflows
            </Link>
            <Link href="/settings" className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              Settings
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Suspense fallback={null}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
      <SignOutButton />
    </div>
  );
}
