import {
  Braces,
  CalendarClock,
  Clock,
  Filter,
  GitBranch,
  Globe,
  Mail,
  MessageSquareText,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { SignalGrid } from '@/components/signal-grid';
import { Button } from '@/components/ui/button';
import { plans } from '@/config/plans';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

import { SectionHeading } from './section-heading';
import { WebhookPlayground } from './webhook-playground';

/*
 * Sections of the landing page. Copy lives next to each section so it's easy
 * to find and rewrite for your product.
 */

type BlockKind = 'trigger' | 'schedule' | 'http' | 'email' | 'chat' | 'ai' | 'branch' | 'filter' | 'transform' | 'delay';

const blockIcons: Record<BlockKind, { icon: LucideIcon; name: string }> = {
  trigger: { icon: Zap, name: 'Trigger' },
  schedule: { icon: CalendarClock, name: 'Schedule' },
  http: { icon: Globe, name: 'HTTP request' },
  email: { icon: Mail, name: 'Send email' },
  chat: { icon: MessageSquareText, name: 'Chat message' },
  ai: { icon: Sparkles, name: 'AI prompt' },
  branch: { icon: GitBranch, name: 'Branch' },
  filter: { icon: Filter, name: 'Filter' },
  transform: { icon: Braces, name: 'Transform data' },
  delay: { icon: Clock, name: 'Delay' },
};

const startKinds: BlockKind[] = ['trigger', 'schedule'];


/* -------------------------------------------------------------------------- */
/*  Example workflows                                                          */
/* -------------------------------------------------------------------------- */

const examples: Array<{ title: string; text: string; steps: BlockKind[] }> = [
  {
    title: 'Welcome new sign-ups',
    text: 'Look up the company, have AI write a personal welcome, and email it to the new user.',
    steps: ['trigger', 'http', 'ai', 'email'],
  },
  {
    title: 'Daily sales summary',
    text: 'Every morning at 9, fetch yesterday’s orders, let AI summarize them, and post it to the team channel.',
    steps: ['schedule', 'http', 'ai', 'chat'],
  },
  {
    title: 'Alert on big orders',
    text: 'When an order over $500 comes in, post it to the sales channel right away. Smaller ones are ignored.',
    steps: ['trigger', 'filter', 'chat'],
  },
  {
    title: 'Sort support messages',
    text: 'AI reads each message, then a branch sends urgent ones to the team chat and the rest to the help desk.',
    steps: ['trigger', 'ai', 'branch', 'http'],
  },
  {
    title: 'Enrich new leads',
    text: 'Take a form submission, add company details from a data API, reshape the result and save it to your CRM.',
    steps: ['trigger', 'http', 'transform', 'http'],
  },
  {
    title: 'Retry a slow API',
    text: 'If a request fails, wait a few seconds and try once more before giving up.',
    steps: ['trigger', 'http', 'branch', 'delay', 'http'],
  },
];

export function Examples() {
  return (
    <section id="examples" className="scroll-mt-4 border-y bg-card">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHeading
          title="Ideas to start with"
          text="A few workflows people build in their first week. Each one uses only the blocks that come built in."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => (
            <li key={example.title} className="flex flex-col rounded-xl border bg-background p-6">
              <BlockChain steps={example.steps} />
              <h3 className="mt-6 font-semibold">{example.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{example.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BlockChain({ steps }: { steps: BlockKind[] }) {
  return (
    <div className="flex items-center" aria-label={`Blocks: ${steps.map((step) => blockIcons[step].name).join(', ')}`}>
      {steps.map((step, index) => {
        const { icon: Icon } = blockIcons[step];
        return (
          <div key={index} className="flex items-center">
            {index > 0 && <span aria-hidden className="h-0.5 w-4 bg-border sm:w-5" />}
            <span
              aria-hidden
              className={cn(
                'flex size-9 items-center justify-center rounded-lg',
                startKinds.includes(step) ? 'bg-inverse text-inverse-foreground' : 'bg-accent text-accent-foreground',
              )}
            >
              <Icon className="size-4" />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  How it works                                                               */
/* -------------------------------------------------------------------------- */

const steps = [
  { title: 'Drag blocks onto the canvas', text: 'Pick from the library on the left. Each block does one job.' },
  { title: 'Connect and fill in the details', text: 'Draw a line from one block to the next, and insert data from earlier blocks.' },
  { title: 'Run it', text: 'Press Run or call the webhook. Each block shows how it went.' },
];

type Group = 'start' | 'action' | 'logic';

/** Colors per block group, used for the icon tiles and the legend. */
const groupStyles: Record<Group, { label: string; tile: string; dot: string }> = {
  start: { label: 'Start', tile: 'bg-inverse text-inverse-foreground', dot: 'bg-inverse' },
  action: { label: 'Actions', tile: 'bg-accent text-accent-foreground', dot: 'bg-cobalt' },
  logic: { label: 'Logic', tile: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

const blockTiles: Array<{ kind: BlockKind; group: Group; text: string }> = [
  { kind: 'trigger', group: 'start', text: 'Run button or webhook' },
  { kind: 'schedule', group: 'start', text: 'Hourly, daily or weekly' },
  { kind: 'http', group: 'action', text: 'Call any API' },
  { kind: 'email', group: 'action', text: 'Send an email' },
  { kind: 'chat', group: 'action', text: 'Post to Slack or Discord' },
  { kind: 'ai', group: 'action', text: 'Ask an AI model' },
  { kind: 'branch', group: 'logic', text: 'Pick a path by data' },
  { kind: 'filter', group: 'logic', text: 'Continue only if true' },
  { kind: 'transform', group: 'logic', text: 'Reshape fields' },
  { kind: 'delay', group: 'logic', text: 'Wait a few seconds' },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionHeading center title="From idea to a running workflow in three steps" />

      <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {/* The line that joins the three numbers on wide screens. */}
        <span aria-hidden className="absolute top-4 right-[16.67%] left-[16.67%] hidden h-px bg-border md:block" />
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex flex-col items-center text-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-inverse text-sm font-bold text-inverse-foreground ring-8 ring-background">
              {index + 1}
            </span>
            <h3 className="mt-5 font-semibold">{step.title}</h3>
            <p className="mt-2 max-w-[18rem] leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-24 flex flex-col items-center text-center">
        <h3 className="text-2xl font-bold tracking-[-0.02em]">Ten blocks, ready to use</h3>
        <ul className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground" aria-label="Block groups">
          {Object.values(groupStyles).map((style) => (
            <li key={style.label} className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1">
              <span aria-hidden className={cn('size-2.5 rounded-full', style.dot)} />
              {style.label}
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {blockTiles.map(({ kind, group, text }) => {
          const { icon: Icon, name } = blockIcons[kind];
          return (
            <li key={kind} className="flex flex-col rounded-xl border bg-card p-4 sm:p-5">
              <span className={cn('flex size-10 items-center justify-center rounded-lg', groupStyles[group].tile)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-4 font-semibold">{name}</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{text}</p>
              <span className="sr-only">({groupStyles[group].label})</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Run log band                                                               */
/* -------------------------------------------------------------------------- */

export function RunLogBand() {
  return (
    <section className="bg-band text-band-foreground">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-balance sm:text-[2.1rem]">Connect it to anything with a webhook</h2>
          <p className="mt-4 text-lg leading-relaxed text-band-muted">
            Every workflow gets its own URL. When your sign-up form, store or payment provider sends data to it, the workflow
            runs with that data and every block can use it.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-band-muted">
            Try it with the welcome workflow from the top of the page: send a sign-up and watch which path it takes.
          </p>
          <ul className="mt-8 space-y-3 text-band-foreground/90">
            <li className="flex gap-3">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-cobalt" />
              Get the workflow’s answer back in the same call, or let it run in the background
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-cobalt" />
              Every run is saved with what each block received and returned
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-cobalt" />
              Replace the URL in one click if it ever leaks
            </li>
          </ul>
        </div>
        <WebhookPlayground />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                    */
/* -------------------------------------------------------------------------- */

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-4">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <SectionHeading center title="Pricing" text="Start free. Upgrade when your workflows do real work." />
        <div className="mx-auto mt-14 grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
          {Object.values(plans).map((plan) => {
            const featured = Boolean(plan.highlighted);
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-xl p-7',
                  featured ? 'bg-inverse text-inverse-foreground shadow-lg md:-my-3 md:py-10' : 'border bg-card',
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-cobalt px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className={cn('mt-1', featured ? 'text-inverse-muted' : 'text-muted-foreground')}>{plan.description}</p>
                <p className="mt-6">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>{' '}
                  <span className={featured ? 'text-inverse-muted' : 'text-muted-foreground'}>{plan.interval}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <span aria-hidden className={cn('size-1.5 rounded-full', featured ? 'bg-cobalt' : 'bg-foreground')} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8" variant={featured ? 'default' : 'outline'}>
                  <Link href="/sign-up">{plan.id === 'free' ? 'Start free' : `Start with ${plan.name}`}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                        */
/* -------------------------------------------------------------------------- */

const faqs = [
  {
    question: 'Do I need to know how to code?',
    answer:
      'No. You build workflows by dragging blocks and filling in forms. Knowing how the apps you connect work helps, for example which address their API uses.',
  },
  {
    question: 'What can it connect to?',
    answer:
      'Anything with a web API. The HTTP request block can call almost any service, there are ready blocks for email, Slack and Discord, and the webhook URL lets other apps start your workflows.',
  },
  {
    question: 'What happens if I go over my plan’s limits?',
    answer:
      'Nothing is deleted. Your workflows stop starting new runs until the next month begins or you upgrade. You can check your usage at any time on the settings page.',
  },
  {
    question: 'Which AI models can I use?',
    answer:
      'The AI prompt block works with OpenAI and any service that offers a compatible API. Each block can use a different model.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Your workflows and run history are private to your account. Secrets such as API keys stay on our servers and are never sent to your browser.',
  },
  {
    question: 'Can I cancel at any time?',
    answer: 'Yes. Choose Manage billing on the settings page. Your paid plan stays active until the end of the period you paid for.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-4 border-t bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading title="Questions people ask" text={`Something else? Write to ${siteConfig.supportEmail}.`} />
        <div className="divide-y border-y">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 font-medium [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  aria-hidden
                  className="relative size-4 shrink-0 before:absolute before:top-1/2 before:left-0 before:h-0.5 before:w-4 before:-translate-y-1/2 before:bg-current after:absolute after:top-0 after:left-1/2 after:h-4 after:w-0.5 after:-translate-x-1/2 after:bg-current after:transition-transform group-open:after:scale-y-0"
                />
              </summary>
              <p className="max-w-prose pb-5 leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Closing call to action                                                     */
/* -------------------------------------------------------------------------- */

export function ClosingCta() {
  return (
    <section className="px-6 py-24">
      <div className="relative isolate mx-auto flex w-full max-w-6xl flex-col items-start gap-8 overflow-hidden rounded-2xl bg-cobalt px-8 py-14 text-white sm:px-14 lg:flex-row lg:items-center lg:justify-between">
        <SignalGrid variant="banner" className="-z-10" />
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-balance sm:text-[2.1rem]">Build your first workflow in five minutes</h2>
          <p className="mt-3 text-lg text-white/80">The free plan includes three workflows and a hundred runs a month.</p>
        </div>
        <Button asChild size="lg" className="bg-white text-[#1f3bd6] hover:bg-white/90">
          <Link href="/sign-up">Start building free</Link>
        </Button>
      </div>
    </section>
  );
}
