/**
 * Branding in one place. Change these and the whole app (landing page,
 * emails, editor header, page titles) follows.
 */
export const siteConfig = {
  name: 'FlowKit',
  tagline: 'Visual automations for your team',
  description: 'Build automations by connecting blocks on a canvas: call APIs, branch on data, wait, and ask AI.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  supportEmail: 'support@example.com',
  /** Your company's legal name, used in the footer and the legal pages. */
  legalName: 'Your Company Ltd.',
  /** Country whose law applies, used in the terms of service. */
  legalCountry: 'Your country',
  /** Shown on the legal pages. Update it when you change them. */
  legalUpdated: 'November 8, 2026',
};
