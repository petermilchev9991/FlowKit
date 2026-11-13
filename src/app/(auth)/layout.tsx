import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { BrandMark } from '@/components/brand-mark';
import { SignalGrid } from '@/components/signal-grid';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getCurrentUser } from '@/lib/session';

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Fades out towards the edges of the screen. */}
      <SignalGrid variant="auth" className="-z-10 [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_95%)]" />
      <ThemeToggle className="absolute top-5 right-5" />
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <BrandMark className="mb-8 rounded-md bg-background/80 px-2 py-1 backdrop-blur-sm" />
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">{children}</div>
    </div>
  );
}

/** Someone already signed in goes straight to their workflows. */
async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect('/workflows');
  return null;
}
