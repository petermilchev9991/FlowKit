import Link from 'next/link';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

/** Logo: two blocks joined by a connection. Swap the SVG for your own mark. */
export function BrandMark({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2 font-bold tracking-tight text-ink', className)}>
      <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
        <rect x="2" y="3" width="11" height="9" rx="2.5" className="fill-ink" />
        <rect x="15" y="16" width="11" height="9" rx="2.5" className="fill-cobalt" />
        <path d="M7.5 12v3.5a5 5 0 0 0 5 5H15" fill="none" className="stroke-ink" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-[17px]">{siteConfig.name}</span>
    </Link>
  );
}
