'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn, signUp } from '@/lib/auth-client';

type Mode = 'sign-in' | 'sign-up';
type Provider = 'github' | 'google';

const providerNames: Record<Provider, string> = { github: 'GitHub', google: 'Google' };

export function AuthForm({ mode, providers }: { mode: Mode; providers: Provider[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    const result =
      mode === 'sign-up'
        ? await signUp.email({ email, password, name: String(form.get('name') ?? '') || email.split('@')[0]! })
        : await signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? 'That did not work. Check your details and try again.');
      setIsPending(false);
      return;
    }
    router.push('/workflows');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {providers.length > 0 && (
        <>
          <div className="grid gap-2">
            {providers.map((provider) => (
              <Button
                key={provider}
                type="button"
                variant="outline"
                onClick={() => signIn.social({ provider, callbackURL: '/workflows' })}
              >
                Continue with {providerNames[provider]}
              </Button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">or use your email</p>
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === 'sign-up' && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          />
          {mode === 'sign-up' && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {mode === 'sign-up' ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'sign-up' ? (
          <>
            Already have an account?{' '}
            <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
