'use client';

import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * A pretend webhook call to the "Welcome new sign-ups" workflow from the hero.
 * Visitors pick or edit a sign-up, send it, and watch the run: the branch goes
 * a different way for big and small teams. Everything runs in the browser;
 * nothing is sent anywhere.
 */

type Signup = { name: string; email: string; company: string; teamSize: string };

const samples: Array<{ label: string; signup: Signup }> = [
  { label: 'Ada at Acme', signup: { name: 'Ada', email: 'ada@acme.com', company: 'Acme', teamSize: '40' } },
  { label: 'Sam at a small studio', signup: { name: 'Sam', email: 'sam@tinystudio.co', company: 'Tiny Studio', teamSize: '3' } },
];

type Step = {
  label: string;
  kind: string;
  detail: string;
  time: string;
  status: 'success' | 'skipped';
};

function plan(signup: Signup): { steps: Step[]; response: string } {
  const size = Number(signup.teamSize) || 0;
  const big = size >= 10;
  const firstName = signup.name.trim() || 'there';
  const steps: Step[] = [
    { label: 'New sign-up', kind: 'Trigger', detail: `received ${signup.email || 'a sign-up'}`, time: '1 ms', status: 'success' },
    { label: 'Look up company', kind: 'HTTP request', detail: `200, ${size} ${size === 1 ? 'person' : 'people'}`, time: '342 ms', status: 'success' },
    { label: 'Team of 10+?', kind: 'Branch', detail: big ? 'matched "Yes"' : 'matched "No"', time: '1 ms', status: 'success' },
    big
      ? { label: 'Welcome email', kind: 'AI prompt', detail: 'wrote a personal welcome', time: '1.9 s', status: 'success' }
      : { label: 'Welcome email', kind: 'AI prompt', detail: 'skipped', time: '', status: 'skipped' },
    big
      ? { label: 'Add to newsletter', kind: 'HTTP request', detail: 'skipped', time: '', status: 'skipped' }
      : { label: 'Add to newsletter', kind: 'HTTP request', detail: '201, subscribed', time: '214 ms', status: 'success' },
  ];
  const output = big
    ? { text: `Hi ${firstName}, welcome to the team! I saw ${signup.company || 'your company'} has ${size} people…` }
    : { status: 201, body: { subscribed: signup.email } };
  return { steps, response: JSON.stringify({ status: 'success', output }) };
}

const STEP_DELAY_MS = 450;

export function WebhookPlayground() {
  const [signup, setSignup] = useState<Signup>(samples[0]!.signup);
  const [shown, setShown] = useState<number | null>(null); // how many steps are visible; null = not sent yet
  const [result, setResult] = useState<ReturnType<typeof plan> | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const body = JSON.stringify({ name: signup.name, email: signup.email, company: signup.company, teamSize: Number(signup.teamSize) || 0 }, null, 2);
  const isRunning = result !== null && shown !== null && shown < result.steps.length;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signup.email);

  function update(field: keyof Signup, value: string) {
    setSignup((current) => ({ ...current, [field]: value }));
    reset();
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setShown(null);
    setResult(null);
  }

  function send() {
    reset();
    const next = plan(signup);
    setResult(next);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setShown(next.steps.length);
      return;
    }
    setShown(0);
    next.steps.forEach((_, index) => {
      timers.current.push(setTimeout(() => setShown(index + 1), (index + 1) * STEP_DELAY_MS));
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-band-line bg-black/25 text-[13px]">
      {/* Request */}
      <div className="border-b border-band-line p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-band-muted">
            <span className="mr-2 rounded bg-cobalt px-1.5 py-0.5 text-[11px] font-bold text-white">POST</span>
            /api/hooks/…?wait=true
          </p>
          <div className="flex gap-1" role="group" aria-label="Example sign-ups">
            {samples.map((sample) => {
              const selected = sample.signup.email === signup.email && sample.signup.teamSize === signup.teamSize;
              return (
                <button
                  key={sample.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setSignup(sample.signup);
                    reset();
                  }}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs transition-colors',
                    selected ? 'bg-band-foreground/15 text-band-foreground' : 'text-band-muted hover:text-band-foreground',
                  )}
                >
                  {sample.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Name" value={signup.name} onChange={(value) => update('name', value)} />
          <Field label="Email" value={signup.email} onChange={(value) => update('email', value)} invalid={!emailValid} />
          <Field label="Company" value={signup.company} onChange={(value) => update('company', value)} />
          <Field label="Team size" value={signup.teamSize} onChange={(value) => update('teamSize', value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" />
        </div>

        <details className="mt-3 text-band-muted">
          <summary className="cursor-pointer text-xs hover:text-band-foreground">Show the JSON body</summary>
          <pre className="mt-2 overflow-x-auto rounded-md bg-black/30 p-3 font-mono text-xs leading-relaxed">{body}</pre>
        </details>

        <button
          type="button"
          onClick={send}
          disabled={isRunning || !emailValid}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-cobalt px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Send className="size-4" />
          {isRunning ? 'Running…' : 'Send request'}
        </button>
        {!emailValid && <p className="mt-2 text-xs text-amber">Enter an email address to send.</p>}
      </div>

      {/* Run */}
      <div aria-live="polite" className="min-h-[214px] px-5 py-4 font-mono">
        {result === null || shown === null ? (
          <p className="pt-16 text-center font-sans text-band-muted">
            Change the team size and send it again: the branch takes a different path.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {result.steps.slice(0, shown).map((step) => (
              <li key={step.label} className={cn('flex items-center gap-3', step.status === 'skipped' && 'opacity-45')}>
                <span aria-hidden className={cn('size-2 shrink-0 rounded-full', step.status === 'success' ? 'bg-mint' : 'bg-band-muted')} />
                <span className="flex-1 truncate">
                  <span className="text-band-foreground">{step.label}</span>{' '}
                  <span className="text-band-muted">
                    {step.kind}, {step.detail}
                  </span>
                </span>
                <span className="text-band-muted">{step.time}</span>
              </li>
            ))}
            {isRunning && (
              <li className="flex items-center gap-3 text-band-muted">
                <span aria-hidden className="size-2 shrink-0 animate-pulse rounded-full bg-amber" />
                working…
              </li>
            )}
          </ol>
        )}
      </div>

      {/* Response */}
      {result && shown === result.steps.length && (
        <div className="border-t border-band-line px-5 py-4 font-mono text-band-muted">
          <span className="text-mint">200 OK</span>
          <p className="mt-2 text-xs leading-relaxed break-all">{result.response}</p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  invalid = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  inputMode?: 'numeric';
}) {
  return (
    <label className="block">
      <span className="text-xs text-band-muted">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        className="mt-1 w-full rounded-md border border-band-line bg-black/30 px-2.5 py-1.5 text-band-foreground outline-none focus:border-cobalt aria-invalid:border-amber"
      />
    </label>
  );
}
