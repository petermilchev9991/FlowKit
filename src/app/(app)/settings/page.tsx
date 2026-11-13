import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isBillingConfigured, purchasablePlans } from '@/lib/billing';
import { getUsage, getUserPlan } from '@/lib/limits';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage(props: PageProps<'/settings'>) {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <Suspense fallback={<div className="mt-8 h-64 rounded-xl border bg-card" aria-hidden />}>
        <SettingsContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function SettingsContent({ searchParams }: { searchParams: PageProps<'/settings'>['searchParams'] }) {
  const user = await requireUser();
  const params = await searchParams;
  const [{ plan, subscription }, usage] = await Promise.all([getUserPlan(user.id), getUsage(user.id)]);
  const billingReady = isBillingConfigured();
  const isPaid = plan.id !== 'free';
  // A paid plan comes from a live subscription; plan changes then go through the billing portal.
  const hasActiveSubscription = isPaid && subscription !== null;
  const upgradeOptions = purchasablePlans();

  return (
    <div className="mt-8 space-y-6">
      {params.upgraded === '1' && (
        <p role="status" className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-success-foreground">
          Thanks for upgrading. Your plan updates as soon as the payment is confirmed, usually within a minute.
        </p>
      )}

      <section className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold">Account</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{user.name}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              Plan <Badge variant={isPaid ? 'default' : 'secondary'}>{plan.name}</Badge>
            </h2>
            {hasActiveSubscription && subscription.status === 'cancelled' && subscription.endsAt && (
              <p className="mt-1 text-sm text-muted-foreground">
                Cancelled. {plan.name} features stay on until {subscription.endsAt.toLocaleDateString()}.
              </p>
            )}
            {hasActiveSubscription && subscription.status !== 'cancelled' && subscription.renewsAt && (
              <p className="mt-1 text-sm text-muted-foreground">Renews on {subscription.renewsAt.toLocaleDateString()}.</p>
            )}
          </div>
          {billingReady && hasActiveSubscription && (
            <Button asChild variant="outline">
              <a href="/api/billing/portal">Manage billing</a>
            </Button>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Meter label="Workflows" used={usage.workflows} limit={plan.limits.workflows} />
          <Meter label="Runs this month" used={usage.runsThisMonth} limit={plan.limits.runsPerMonth} />
        </div>

        {billingReady && !hasActiveSubscription && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {upgradeOptions.map((option) => (
              <div key={option.id} className="flex flex-col rounded-lg border p-4">
                <p className="font-medium">
                  {option.name}{' '}
                  <span className="font-normal text-muted-foreground">
                    {option.price} {option.interval}
                  </span>
                </p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">Includes {option.summary}.</p>
                <Button asChild className="mt-4 self-start" variant={option.highlighted ? 'default' : 'outline'}>
                  <a href={`/api/billing/checkout?plan=${option.id}`}>Upgrade to {option.name}</a>
                </Button>
              </div>
            ))}
          </div>
        )}

        {!billingReady && (
          <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            Billing isn&apos;t connected yet. Add your Lemon Squeezy keys to the environment to turn on upgrades (see the
            README).
          </p>
        )}
      </section>
    </div>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = !Number.isFinite(limit);
  const percent = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used.toLocaleString('en-US')} {unlimited ? 'used' : `of ${limit.toLocaleString('en-US')}`}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
          <div className={percent >= 90 ? 'h-full bg-destructive' : 'h-full bg-cobalt'} style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
