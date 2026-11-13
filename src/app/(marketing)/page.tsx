import Link from 'next/link';

import { HeroDiagram } from '@/components/marketing/hero-diagram';
import { ProductShot } from '@/components/marketing/product-shot';
import { ClosingCta, Examples, Faq, HowItWorks, Pricing, RunLogBand } from '@/components/marketing/sections';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-10 pb-24 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
        <div className="max-w-xl">
          <h1 className="text-[2.6rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance sm:text-[3.6rem]">
            Build automations by connecting blocks
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            Call any API, branch on the result, wait, and let AI write the reply. Start a workflow from a button or a webhook,
            and watch every step run.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Start building free</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              {/* Plain <a> for on-page links: they scroll every time they're clicked. */}
              <a href="#pricing">See pricing</a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Free plan, no card needed.</p>
        </div>
        <HeroDiagram />
      </section>
      <ProductShot />
      <Examples />
      <HowItWorks />
      <RunLogBand />
      <Pricing />
      <Faq />
      <ClosingCta />
    </>
  );
}
