import { siteConfig } from '@/config/site';

/**
 * Layout for the privacy policy and terms. The text in those pages is a
 * starting template: replace the details for your business and have it
 * reviewed by a lawyer before you rely on it.
 */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
      <h1 className="text-4xl font-bold tracking-[-0.02em]">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated {siteConfig.legalUpdated}</p>
      <div className="mt-10 space-y-5 leading-relaxed text-foreground/90 [&_a]:text-cobalt [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
