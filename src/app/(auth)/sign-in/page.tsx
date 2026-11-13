import type { Metadata } from 'next';

import { enabledSocialProviders } from '@/lib/auth-providers';

import { AuthForm } from '../auth-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-bold tracking-tight">Sign in</h1>
      <AuthForm mode="sign-in" providers={enabledSocialProviders} />
    </>
  );
}
