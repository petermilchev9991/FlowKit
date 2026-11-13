import { BrandMark } from '@/components/brand-mark';
import { ThemeToggle } from '@/components/theme/theme-toggle';

import { HeaderAuthLinks } from './header-auth-links';

// Plain <a> for on-page links: they scroll every time they're clicked, from any page.
const sections = [
  { href: '/#examples', label: 'Examples' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
      <BrandMark />
      <nav className="flex items-center gap-1 text-sm">
        {sections.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground md:block"
          >
            {section.label}
          </a>
        ))}
        <ThemeToggle />
        <HeaderAuthLinks />
      </nav>
    </header>
  );
}
