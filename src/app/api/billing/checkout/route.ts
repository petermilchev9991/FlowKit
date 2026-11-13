import { isPlanId, plans } from '@/config/plans';
import { auth } from '@/lib/auth';
import { createPlanCheckout, isBillingConfigured } from '@/lib/billing';

/**
 * Sends the signed-in user to the Lemon Squeezy checkout for a paid plan:
 * /api/billing/checkout?plan=pro or ?plan=business
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.redirect(new URL('/sign-in', request.url), 303);

  const planId = new URL(request.url).searchParams.get('plan');
  const plan = isPlanId(planId) ? plans[planId] : null;
  if (!isBillingConfigured() || !plan?.variantId) {
    return Response.redirect(new URL('/settings?billing=not-configured', request.url), 303);
  }

  const url = await createPlanCheckout(session.user, plan);
  return Response.redirect(url, 303);
}
