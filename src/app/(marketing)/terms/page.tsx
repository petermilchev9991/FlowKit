import type { Metadata } from 'next';

import { LegalPage } from '@/components/marketing/legal-page';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = { title: 'Terms of service' };

/*
 * TEMPLATE. A starting point for a typical subscription SaaS built with this
 * kit. Replace the details in src/config/site.ts, adjust the text to your
 * business, and have it reviewed by a lawyer before you rely on it.
 */
export default function TermsPage() {
  const { name, legalName, legalCountry, supportEmail } = siteConfig;
  return (
    <LegalPage title="Terms of service">
      <p>
        These terms are an agreement between you and {legalName} (&quot;we&quot;) about your use of {name}. By creating an
        account, you accept them. If you use {name} for a company, you accept them on its behalf.
      </p>

      <h2>Your account</h2>
      <p>
        Keep your sign-in details safe; you are responsible for what happens in your account. You must be at least 16 years old,
        or the age of digital consent where you live, to use {name}.
      </p>

      <h2>Acceptable use</h2>
      <p>You may not use {name} to:</p>
      <ul>
        <li>break the law or help others break it;</li>
        <li>send spam, or contact people who have not agreed to hear from you;</li>
        <li>attack, overload or scan systems you do not own or have permission to test;</li>
        <li>get around your plan&apos;s limits or our security measures;</li>
        <li>process data you have no right to process.</li>
      </ul>
      <p>We may pause workflows or accounts that break these rules, and we will tell you why when we can.</p>

      <h2>Your content</h2>
      <p>
        Your workflows and the data they process belong to you. You give us permission to store and process them only to run
        the service for you. See the <a href="/privacy">privacy policy</a> for details.
      </p>

      <h2>Plans and payment</h2>
      <ul>
        <li>The Free plan costs nothing and has the limits shown on the pricing page.</li>
        <li>
          Paid plans renew automatically each billing period until you cancel. Payments are processed by Lemon Squeezy, our
          merchant of record, under its own terms.
        </li>
        <li>You can cancel at any time from the settings page. Your paid plan stays active until the end of the paid period.</li>
        <li>We may change prices with at least 30 days&apos; notice. The change applies from your next billing period.</li>
      </ul>

      <h2>Availability</h2>
      <p>
        We work to keep {name} running and your data safe, but we cannot promise the service will never be interrupted. Keep
        your own copies of anything critical, such as exported workflows.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        {name} is provided &quot;as is&quot;. To the extent the law allows, we are not liable for indirect or consequential losses,
        and our total liability is limited to the amount you paid us in the 12 months before the claim.
      </p>

      <h2>Ending the agreement</h2>
      <p>
        You can close your account at any time by writing to{' '}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. We may close accounts that seriously or repeatedly break these terms. When an
        account closes, we delete its data as described in the privacy policy.
      </p>

      <h2>Changes and law</h2>
      <p>
        If we change these terms in a way that matters, we will tell you before the change takes effect. These terms are
        governed by the laws of {legalCountry}. Questions go to <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
    </LegalPage>
  );
}
