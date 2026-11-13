'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * The hero: a small workflow on a contrasting canvas (dark on the light theme,
 * light on the dark theme) that runs when the page opens.
 * A pulse travels along each connection and blocks tick to "done" in turn;
 * the branch not taken is skipped. It replays every few seconds. Drawn in SVG
 * (SMIL animation); remounting the <svg> restarts its timeline. With reduced
 * motion, the finished state is shown straight away.
 */

const RUN_SECONDS = 4.6;
/** Rest between runs, so the finished state can be read. */
const PAUSE_SECONDS = 3.5;

type Block = {
  id: string;
  x: number;
  y: number;
  title: string;
  kind: string;
  icon: 'bolt' | 'globe' | 'split' | 'spark';
  /** Seconds after start when the block finishes. */
  doneAt?: number;
  /** Seconds after start when the block is marked skipped. */
  skippedAt?: number;
};

const blocks: Block[] = [
  { id: 'signup', x: 192, y: 16, title: 'New sign-up', kind: 'Webhook', icon: 'bolt', doneAt: 0.5 },
  { id: 'lookup', x: 192, y: 116, title: 'Look up company', kind: 'HTTP request', icon: 'globe', doneAt: 1.7 },
  { id: 'branch', x: 192, y: 216, title: 'Team of 10+?', kind: 'Branch', icon: 'split', doneAt: 2.6 },
  { id: 'email', x: 22, y: 340, title: 'Welcome email', kind: 'AI prompt', icon: 'spark', doneAt: 4.3 },
  { id: 'list', x: 362, y: 340, title: 'Add to newsletter', kind: 'HTTP request', icon: 'globe', skippedAt: 2.7 },
];

const connections = [
  { id: 'c1', d: 'M300 80 L300 116', start: 0.6, end: 1.1 },
  { id: 'c2', d: 'M300 180 L300 216', start: 1.8, end: 2.3 },
  { id: 'c3', d: 'M262 280 L262 302 Q262 312 252 312 L140 312 Q130 312 130 322 L130 340', start: 2.7, end: 3.5 },
  { id: 'c4', d: 'M338 280 L338 302 Q338 312 348 312 L460 312 Q470 312 470 322 L470 340' },
];

/** Fades something in at `at` seconds and keeps it visible. */
function FadeIn({ at }: { at: number }) {
  return <animate attributeName="opacity" from="0" to="1" begin={`${at}s`} dur="0.25s" fill="freeze" />;
}

function Icon({ name }: { name: Block['icon'] }) {
  const common = { fill: 'none', stroke: 'white', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'bolt':
      return <path d="M13 3 L7 12 H11 L10 17 L16 8 H12 Z" {...common} />;
    case 'globe':
      return (
        <g {...common}>
          <circle cx="11" cy="10" r="6.5" />
          <path d="M4.5 10 H17.5 M11 3.5 C8.5 6 8.5 14 11 16.5 C13.5 14 13.5 6 11 3.5" />
        </g>
      );
    case 'split':
      return <path d="M11 17 V11 M11 11 L6 5 M11 11 L16 5 M4 5 H8 M14 5 H18" {...common} />;
    case 'spark':
      return <path d="M11 3 L12.6 8.4 L18 10 L12.6 11.6 L11 17 L9.4 11.6 L4 10 L9.4 8.4 Z" {...common} />;
  }
}

function BlockShape({ block, animated }: { block: Block; animated: boolean }) {
  const skipped = block.skippedAt !== undefined;
  return (
    <g transform={`translate(${block.x} ${block.y})`}>
      <rect width="216" height="64" rx="12" fill="var(--night-block)" stroke="var(--night-line)" strokeDasharray={skipped ? '4 4' : undefined} />
      <rect x="12" y="14" width="36" height="36" rx="9" fill={block.icon === 'bolt' ? 'var(--night-tile)' : 'var(--brand-cobalt)'} />
      <g transform="translate(19 22)">
        <Icon name={block.icon} />
      </g>
      <text x="60" y="29" fontSize="13" fontWeight="650" fill="var(--night-text)">
        {block.title}
      </text>
      <text x="60" y="47" fontSize="11.5" fill="var(--night-muted)">
        {block.kind}
      </text>
      <circle cx="196" cy="32" r="7" fill="none" stroke="var(--night-edge)" strokeWidth="2" />
      {!skipped && (
        <g opacity={animated ? 0 : 1}>
          {animated && <FadeIn at={block.doneAt!} />}
          <circle cx="196" cy="32" r="8" fill="var(--brand-mint)" />
          <path d="M192.5 32 L195 34.5 L199.5 29.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {skipped && (
        <g opacity={animated ? 0 : 1}>
          {animated && <FadeIn at={block.skippedAt!} />}
          <rect width="216" height="64" rx="12" fill="var(--night)" opacity="0.55" />
          <circle cx="196" cy="32" r="8" fill="var(--night-skip)" />
          <path d="M192.5 32 H199.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function Diagram({ animated }: { animated: boolean }) {
  return (
    <svg
      viewBox="0 0 600 420"
      role="img"
      aria-label="Example workflow: a new sign-up triggers a company lookup, a branch checks the team size, and an AI prompt drafts a welcome email."
      className="h-auto w-full font-sans"
    >
      {connections.map((connection) => (
        <path
          key={connection.id}
          d={connection.d}
          fill="none"
          stroke="var(--night-edge)"
          strokeWidth="2"
          strokeDasharray={connection.start === undefined ? '4 5' : undefined}
        />
      ))}
      <text x="196" y="306" fontSize="11" fill="var(--night-muted)" textAnchor="middle">
        Yes
      </text>
      <text x="404" y="306" fontSize="11" fill="var(--night-muted)" textAnchor="middle">
        No
      </text>
      {blocks.map((block) => (
        <BlockShape key={block.id} block={block} animated={animated} />
      ))}
      {animated &&
        connections
          .filter((connection) => connection.start !== undefined)
          .map((connection) => (
            <circle key={`pulse-${connection.id}`} r="5" fill="var(--night-pulse)" opacity="0">
              <animateMotion path={connection.d} begin={`${connection.start}s`} dur={`${connection.end! - connection.start!}s`} fill="freeze" />
              <set attributeName="opacity" to="1" begin={`${connection.start}s`} />
              <set attributeName="opacity" to="0" begin={`${connection.end}s`} />
            </circle>
          ))}
    </svg>
  );
}

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function HeroDiagram() {
  const [runCount, setRunCount] = useState(0);
  const [finishedRun, setFinishedRun] = useState(-1);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );

  // Each run lasts RUN_SECONDS, rests for a few seconds, then plays again.
  useEffect(() => {
    if (reducedMotion) return;
    const done = setTimeout(() => setFinishedRun(runCount), RUN_SECONDS * 1000);
    const next = setTimeout(() => setRunCount((count) => count + 1), (RUN_SECONDS + PAUSE_SECONDS) * 1000);
    return () => {
      clearTimeout(done);
      clearTimeout(next);
    };
  }, [runCount, reducedMotion]);

  const running = finishedRun !== runCount && !reducedMotion;

  return (
    <div className="overflow-hidden rounded-2xl border border-night-line bg-night shadow-[0_24px_60px_-20px_var(--night-shadow)]">
      <div className="flex items-center justify-between gap-3 border-b border-night-line px-4 py-3">
        <p className="text-sm font-medium text-[var(--night-text)]">Welcome new sign-ups</p>
        <p
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-full border border-night-line px-2.5 py-1 text-xs text-[var(--night-muted)]"
        >
          <span
            aria-hidden
            className={running ? 'size-2 animate-pulse rounded-full bg-amber' : 'size-2 rounded-full bg-mint'}
          />
          {running ? 'Running' : 'Succeeded in 4.3 s'}
        </p>
      </div>
      <div className="bg-[radial-gradient(var(--night-line)_1px,transparent_1px)] [background-size:18px_18px] p-4 sm:p-6">
        <Diagram key={runCount} animated={!reducedMotion} />
      </div>
    </div>
  );
}
