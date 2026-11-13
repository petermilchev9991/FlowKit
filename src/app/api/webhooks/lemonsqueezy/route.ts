import { handleSubscriptionEvent, verifyWebhookSignature } from '@/lib/billing';

/**
 * Lemon Squeezy webhook. In the Lemon Squeezy dashboard (Settings -> Webhooks),
 * point a webhook at <your app url>/api/webhooks/lemonsqueezy, set a signing
 * secret (copy it into LEMONSQUEEZY_WEBHOOK_SECRET) and select the
 * subscription_* events.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get('x-signature'))) {
    return Response.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event?.meta?.event_name ?? '';

  if (eventName.startsWith('subscription_') && !eventName.startsWith('subscription_payment')) {
    const result = await handleSubscriptionEvent(event);
    return Response.json({ received: true, result });
  }
  // Orders, payments and license keys are acknowledged but not stored.
  return Response.json({ received: true, result: 'ignored' });
}
