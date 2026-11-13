import 'server-only';

import { and, count, eq, gte } from 'drizzle-orm';

import { type Plan, planForVariant } from '@/config/plans';
import { db } from '@/db';
import { runs, subscriptions, workflows } from '@/db/schema';

/** Subscription states that still give access to the paid plan. */
const ACTIVE_STATUSES = new Set(['on_trial', 'active', 'past_due', 'cancelled']);

export async function getUserPlan(userId: string): Promise<{ plan: Plan; subscription: typeof subscriptions.$inferSelect | null }> {
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  if (!subscription) return { plan: planForVariant(null), subscription: null };

  // A cancelled subscription keeps working until the paid period ends.
  const stillValid =
    ACTIVE_STATUSES.has(subscription.status) &&
    !(subscription.status === 'cancelled' && subscription.endsAt && subscription.endsAt < new Date());

  return { plan: stillValid ? planForVariant(subscription.variantId) : planForVariant(null), subscription };
}

export function startOfMonthUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getUsage(userId: string) {
  const [[workflowCount], [runCount]] = await Promise.all([
    db.select({ value: count() }).from(workflows).where(eq(workflows.userId, userId)),
    db
      .select({ value: count() })
      .from(runs)
      .where(and(eq(runs.userId, userId), gte(runs.startedAt, startOfMonthUtc()))),
  ]);
  return { workflows: workflowCount?.value ?? 0, runsThisMonth: runCount?.value ?? 0 };
}

export class LimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LimitError';
  }
}

export async function assertCanCreateWorkflow(userId: string) {
  const [{ plan }, usage] = await Promise.all([getUserPlan(userId), getUsage(userId)]);
  if (usage.workflows >= plan.limits.workflows) {
    throw new LimitError(`Your ${plan.name} plan includes ${plan.limits.workflows} workflows. Upgrade to add more.`);
  }
}

export async function assertCanRun(userId: string) {
  const [{ plan }, usage] = await Promise.all([getUserPlan(userId), getUsage(userId)]);
  if (usage.runsThisMonth >= plan.limits.runsPerMonth) {
    throw new LimitError(
      `You've used all ${plan.limits.runsPerMonth.toLocaleString('en-US')} runs in your ${plan.name} plan this month. Upgrade for more.`,
    );
  }
}
