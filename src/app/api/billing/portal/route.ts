import { getCustomerPortalUrl, isBillingConfigured } from '@/lib/billing';
import { getUserPlan } from '@/lib/limits';
import { getUserIdFromRequest } from '@/lib/session';

/** Opens the Lemon Squeezy customer portal (invoices, card, cancel). */
export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.redirect(new URL('/sign-in', request.url), 303);

  const { subscription } = await getUserPlan(userId);
  if (!isBillingConfigured() || !subscription) return Response.redirect(new URL('/settings', request.url), 303);

  const url = await getCustomerPortalUrl(subscription.id);
  return Response.redirect(url, 303);
}
