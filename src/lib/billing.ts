import 'server-only';

import { createCheckout, getSubscription, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';

import { paidPlans, type Plan } from '@/config/plans';
import { siteConfig } from '@/config/site';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';

/** Billing turns on when the Lemon Squeezy keys and at least one paid plan's variant ID are present. */
export function isBillingConfigured() {
  return Boolean(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID && purchasablePlans().length > 0);
}

/** Paid plans that have a Lemon Squeezy variant ID, so they can be bought. */
export function purchasablePlans(): Plan[] {
  return paidPlans.filter((plan) => Boolean(plan.variantId));
}

let configured = false;
function setup() {
  if (configured) return;
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY!, onError: (error) => console.error('Lemon Squeezy:', error.message) });
  configured = true;
}

/** Creates a hosted checkout for a paid plan and returns its URL. */
export async function createPlanCheckout(user: { id: string; email: string; name: string }, plan: Plan) {
  if (!plan.variantId) throw new Error(`The ${plan.name} plan has no Lemon Squeezy variant ID.`);
  setup();
  const { data, error } = await createCheckout(process.env.LEMONSQUEEZY_STORE_ID!, plan.variantId, {
    checkoutData: {
      email: user.email,
      name: user.name,
      // Comes back in every webhook for this subscription, so we know whose it is.
      custom: { user_id: user.id },
    },
    productOptions: {
      redirectUrl: `${siteConfig.url}/settings?upgraded=1`,
      enabledVariants: [Number(plan.variantId)],
    },
  });
  if (error || !data) throw new Error(`Could not create checkout: ${error?.message ?? 'no data'}`);
  return data.data.attributes.url;
}

/** A signed, short-lived link to the Lemon Squeezy customer portal. */
export async function getCustomerPortalUrl(subscriptionId: string) {
  setup();
  const { data, error } = await getSubscription(subscriptionId);
  if (error || !data) throw new Error(`Could not load subscription: ${error?.message ?? 'no data'}`);
  return data.data.attributes.urls.customer_portal;
}

/** Checks the X-Signature header of a webhook against the raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'), 'utf8');
  const received = Buffer.from(signature, 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

type SubscriptionEvent = {
  meta: { event_name: string; custom_data?: { user_id?: string } };
  data: {
    id: string;
    type: string;
    attributes: {
      customer_id: number;
      variant_id: number;
      status: string;
      renews_at: string | null;
      ends_at: string | null;
      first_subscription_item?: { quantity?: number } | null;
    };
  };
};

/**
 * Stores the latest state of a subscription. Lemon Squeezy sends the full
 * subscription with every event, so each event simply overwrites the row.
 */
export async function handleSubscriptionEvent(event: SubscriptionEvent) {
  if (event.data.type !== 'subscriptions') return 'ignored';
  const userId = event.meta.custom_data?.user_id;
  if (!userId) return 'ignored: no user_id in custom data';

  const attributes = event.data.attributes;
  const values = {
    id: String(event.data.id),
    userId,
    customerId: String(attributes.customer_id),
    variantId: String(attributes.variant_id),
    status: attributes.status,
    renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
    endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
    quantity: attributes.first_subscription_item?.quantity ?? 1,
  };

  // One row per user. If an old subscription's late "expired" event arrives
  // after the user already started a new subscription, keep the new one.
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const isEnded = values.status === 'expired' || values.status === 'cancelled';
  if (existing && existing.id !== values.id && isEnded) return 'ignored: older subscription';

  await db
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({ target: subscriptions.userId, set: { ...values, updatedAt: sql`now()` } });
  return 'stored';
}
