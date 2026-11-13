/**
 * Pricing plans and their limits.
 *
 * `variantId` links a paid plan to a Lemon Squeezy product variant. Create one
 * subscription product in Lemon Squeezy with a variant per paid plan, copy the
 * variant IDs into .env, and the upgrade buttons start working. Limits are
 * enforced in src/lib/limits.ts. Plans appear on the landing page in this order.
 */
export type PlanId = 'free' | 'pro' | 'business';

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  interval: string;
  description: string;
  /** One line used in upgrade prompts, e.g. "unlimited workflows and 10,000 runs a month". */
  summary: string;
  features: string[];
  limits: {
    /** Maximum number of saved workflows. `Infinity` for unlimited. */
    workflows: number;
    /** Maximum workflow runs per calendar month (UTC). */
    runsPerMonth: number;
  };
  /** Shown as the recommended plan on the landing page. Set on one plan at most. */
  highlighted?: boolean;
  variantId?: string;
};

export const plans: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0',
    interval: 'forever',
    description: 'For trying things out.',
    summary: '3 workflows and 100 runs a month',
    features: ['3 workflows', '100 runs per month', 'Webhook triggers', 'Run history'],
    limits: { workflows: 3, runsPerMonth: 100 },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    interval: 'per month',
    description: 'For people running real automations.',
    summary: 'unlimited workflows and 10,000 runs a month',
    features: ['Everything in Free', 'Unlimited workflows', '10,000 runs per month', 'Email support'],
    limits: { workflows: Infinity, runsPerMonth: 10_000 },
    highlighted: true,
    variantId: process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
  },
  business: {
    id: 'business',
    name: 'Business',
    price: '$49',
    interval: 'per month',
    description: 'For teams with high volume.',
    summary: 'unlimited workflows and 100,000 runs a month',
    features: ['Everything in Pro', '100,000 runs per month', 'Priority support'],
    limits: { workflows: Infinity, runsPerMonth: 100_000 },
    variantId: process.env.LEMONSQUEEZY_BUSINESS_VARIANT_ID,
  },
};

export const paidPlans = Object.values(plans).filter((plan) => plan.id !== 'free');

export function planForVariant(variantId: string | null | undefined): Plan {
  const match = Object.values(plans).find((plan) => plan.variantId && plan.variantId === variantId);
  return match ?? plans.free;
}

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in plans;
}
