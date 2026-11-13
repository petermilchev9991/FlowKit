import type { Metadata } from 'next';

import { enabledSocialProviders } from '@/lib/auth-providers';

import { AuthForm } from '../auth-form';

export const metadata: Metadata = { title: 'Create an account' };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Free plan, no card needed.</p>
      <AuthForm mode="sign-up" providers={enabledSocialProviders} />
    </>
  );
}
