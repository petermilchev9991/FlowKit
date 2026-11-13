import Link from 'next/link';

import { BrandMark } from '@/components/brand-mark';
import { siteConfig } from '@/config/site';

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/#examples', label: 'Examples' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/#faq', label: 'FAQ' },
      { href: '/sign-up', label: 'Create an account' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <BrandMark />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{siteConfig.description}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold">{column.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('/#') ? (
                    <a href={link.href} className="text-muted-foreground hover:text-foreground">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="text-sm font-semibold">Contact</h2>
          <p className="mt-3 text-sm">
            <a href={`mailto:${siteConfig.supportEmail}`} className="text-muted-foreground hover:text-foreground">
              {siteConfig.supportEmail}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-muted-foreground">
          © {siteConfig.legalName.replace(/\.$/, '')}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
