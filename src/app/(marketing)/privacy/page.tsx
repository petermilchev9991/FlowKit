import type { Metadata } from 'next';

import { LegalPage } from '@/components/marketing/legal-page';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = { title: 'Privacy policy' };

/*
 * TEMPLATE. This is a starting point written for a typical small SaaS that
 * uses this kit as is. Adjust it to what your business actually does, and
 * have it reviewed by a lawyer, especially if you serve users in the EU (GDPR)
 * or California (CCPA).
 */
export default function PrivacyPage() {
  const { name, legalName, supportEmail } = siteConfig;
  return (
    <LegalPage title="Privacy policy">
      <p>
        This policy explains what information {legalName} (&quot;we&quot;) collects when you use {name}, why we collect it, and
        what choices you have. If you have questions, write to <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address and a securely hashed password, or your profile from GitHub or
          Google if you sign in with them.
        </li>
        <li>
          <strong>Your workflows:</strong> the workflows you build, their settings, and the history of each run, including the data
          each block received and returned.
        </li>
        <li>
          <strong>Data sent to your workflows:</strong> whatever you or other apps send to your workflow&apos;s webhook URL.
        </li>
        <li>
          <strong>Billing details:</strong> payments are handled by Lemon Squeezy, which acts as the merchant of record. We receive
          your subscription status and plan, not your card number.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address and browser type, kept with your sign-in sessions for security.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run the service: sign you in, save your workflows and run them when you ask.</li>
        <li>To bill you for paid plans and apply your plan&apos;s limits.</li>
        <li>To keep the service secure and to fix problems.</li>
        <li>To contact you about your account or important changes to the service.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use your workflow data to advertise to you.</p>

      <h2>Who we share it with</h2>
      <p>We share data only with providers that help us run {name}, and only what they need:</p>
      <ul>
        <li>Our hosting and database providers, which store the service and your data.</li>
        <li>Lemon Squeezy, for payments and invoices.</li>
        <li>Our email provider, to deliver emails that your workflows send.</li>
        <li>
          The AI provider you or we configure, when a workflow uses an AI prompt block. The prompt and its data are sent to that
          provider to get an answer.
        </li>
        <li>The services your own workflows call. Those requests are made because you set them up.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and workflows while your account is open. When you delete a workflow, its run history is deleted
        with it. When you ask us to close your account, we delete your data within 30 days, except records we must keep by law, such as
        invoices.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us for a copy of your data, ask us to correct or delete it, or object to how we use it. Write to{' '}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a> and we will answer within 30 days. If you are in the EU or UK, you
        can also complain to your local data protection authority.
      </p>

      <h2>Cookies</h2>
      <p>
        We use only the cookies needed to keep you signed in, and your browser&apos;s storage to remember settings such as the
        light or dark theme. We do not use advertising or tracking cookies.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy in a way that matters, we will tell you by email or in the app before the change takes effect.
      </p>
    </LegalPage>
  );
}
