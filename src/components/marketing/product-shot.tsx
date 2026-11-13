'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { SectionHeading } from './section-heading';

/**
 * Screenshot of the editor with numbered markers. Hovering, focusing or
 * tapping a number shows what that part of the editor does.
 * Marker positions are percentages of the screenshot; adjust them if you
 * replace the images in public/product/.
 */
const callouts = [
  { x: 22.5, y: 13, title: 'Blocks library', text: 'Drag a block onto the canvas. Each one does a single job.' },
  { x: 47, y: 50, title: 'Results on every block', text: 'After a run, each block shows if it worked and how long it took.' },
  { x: 71.3, y: 47, title: 'Run history', text: 'Open any run to see exactly what each block received and returned.' },
];

export function ProductShot() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionHeading
        center
        title="See every step as it runs"
        text="Build on a canvas, press Run, and watch each block report back. When something fails, you see which block and why."
      />
      <figure className="mt-14">
        <div className="relative rounded-xl border bg-card shadow-[0_30px_80px_-30px_rgba(27,34,51,0.35)]">
          <div className="flex items-center gap-1.5 border-b px-4 py-3" aria-hidden>
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="relative">
            <Image
              src="/product/editor-light.png"
              alt="The workflow editor after a successful run: blocks library on the left, three connected blocks each showing Done, and the run history on the right."
              width={1440}
              height={900}
              className="h-auto w-full rounded-b-xl dark:hidden"
            />
            <Image
              src="/product/editor-dark.png"
              alt="The workflow editor in dark mode after a successful run."
              width={1440}
              height={900}
              className="hidden h-auto w-full rounded-b-xl dark:block"
            />
            {callouts.map((callout, index) => {
              const isOpen = active === index;
              const tooltipId = `product-callout-${index}`;
              return (
                <div
                  key={callout.title}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${callout.x}%`, top: `${callout.y}%` }}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive((current) => (current === index ? null : current))}
                >
                  <button
                    type="button"
                    aria-describedby={isOpen ? tooltipId : undefined}
                    aria-expanded={isOpen}
                    aria-label={callout.title}
                    onClick={() => setActive(isOpen ? null : index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive((current) => (current === index ? null : current))}
                    className={cn(
                      'relative flex size-7 items-center justify-center rounded-full bg-cobalt text-xs font-bold text-white ring-4 ring-cobalt/25 transition-transform hover:scale-110 sm:size-8',
                      !isOpen && 'motion-safe:after:absolute motion-safe:after:inset-0 motion-safe:after:animate-ping motion-safe:after:rounded-full motion-safe:after:bg-cobalt/40',
                    )}
                  >
                    {index + 1}
                  </button>
                  {/* Popover above the number, centered on it, with a small arrow pointing down. */}
                  <div
                    id={tooltipId}
                    role="tooltip"
                    className={cn(
                      'absolute bottom-full left-1/2 z-10 mb-3 hidden w-64 -translate-x-1/2 rounded-lg bg-inverse px-4 py-3 text-left text-inverse-foreground shadow-xl transition-[opacity,translate] duration-150 sm:block',
                      isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0',
                    )}
                  >
                    <p className="text-sm font-semibold">{callout.title}</p>
                    <p className="mt-1 text-[13px] leading-snug text-inverse-muted">{callout.text}</p>
                    <span aria-hidden className="absolute top-full left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-inverse" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <figcaption aria-live="polite" className="mt-5 min-h-12 text-center text-sm text-muted-foreground">
          {/* On small screens the explanation appears here instead of next to the number. */}
          {active !== null ? (
            <span className="sm:hidden">
              <strong className="text-foreground">{callouts[active]!.title}:</strong> {callouts[active]!.text}
            </span>
          ) : null}
          <span className={active !== null ? 'hidden sm:inline' : undefined}>
            <span className="hidden sm:inline">Point at a number to see what that part does.</span>
            <span className="sm:hidden">Tap a number to see what that part does.</span>
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
