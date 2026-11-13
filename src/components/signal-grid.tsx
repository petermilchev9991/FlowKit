'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Animated background: a faint grid of lines. Signals enter at one edge of the
 * screen and travel to the far edge along the lines, turning at intersections
 * on the way. The stretch of wire behind each signal lights up and fades,
 * and corners flash briefly as a signal turns them.
 *
 * - One <canvas>; the grid is pre-rendered, each frame only paints signals.
 * - Motion is time-based, so speed is the same on every screen.
 * - Stops when the tab is hidden or the element is off screen.
 * - With "reduce motion" turned on, only the still grid is shown.
 * - Colors come from CSS variables, so it follows the light and dark theme.
 */

type Variant = 'auth' | 'banner';

const settings: Record<
  Variant,
  { spacing: number; signals: number; speed: [number, number]; trail: number; lineAlpha: number; wireAlpha: number }
> = {
  auth: { spacing: 56, signals: 7, speed: [120, 190], trail: 220, lineAlpha: 0.9, wireAlpha: 0.75 },
  banner: { spacing: 44, signals: 4, speed: [90, 140], trail: 160, lineAlpha: 0.14, wireAlpha: 0.55 },
};

type Point = { x: number; y: number };

type Signal = {
  path: Point[];
  /** Cumulative length at each path point. */
  lengths: number[];
  /** Distance travelled along the path. */
  distance: number;
  speed: number;
  /** Seconds to wait before entering (staggers the signals). */
  delay: number;
  /** Index of the next corner that will flash when reached. */
  nextCorner: number;
};

type Flash = { x: number; y: number; born: number };

export function SignalGrid({ variant, className }: { variant: Variant; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const config = settings[variant];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gridCanvas = document.createElement('canvas');

    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let ratio = 1;
    let lineColor = '';
    let signalRgb = '51, 85, 255';
    let signals: Signal[] = [];
    let flashes: Flash[] = [];
    let frame = 0;
    let lastTime = 0;
    let isVisible = true;

    const random = (min: number, max: number) => min + Math.random() * (max - min);
    const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));

    function readColors() {
      const style = getComputedStyle(canvas!);
      if (variant === 'banner') {
        lineColor = `rgba(255, 255, 255, ${config.lineAlpha})`;
        signalRgb = '255, 255, 255';
        return;
      }
      lineColor = style.getPropertyValue('--border').trim() || '#dde1e8';
      signalRgb = toRgb(style.getPropertyValue('--brand-cobalt').trim()) ?? '51, 85, 255';
    }

    function drawGrid() {
      gridCanvas.width = Math.max(1, canvas!.width);
      gridCanvas.height = Math.max(1, canvas!.height);
      const grid = gridCanvas.getContext('2d')!;
      grid.setTransform(ratio, 0, 0, ratio, 0, 0);
      grid.strokeStyle = lineColor;
      grid.globalAlpha = variant === 'banner' ? 1 : config.lineAlpha;
      grid.lineWidth = 1;
      grid.beginPath();
      for (let column = 0; column <= columns; column++) {
        const x = column * config.spacing + 0.5;
        grid.moveTo(x, 0);
        grid.lineTo(x, height);
      }
      for (let row = 0; row <= rows; row++) {
        const y = row * config.spacing + 0.5;
        grid.moveTo(0, y);
        grid.lineTo(width, y);
      }
      grid.stroke();
    }

    /** A route from one edge to the opposite edge along grid lines, with a few turns. */
    function planPath(): Point[] {
      const spacing = config.spacing;
      const horizontal = Math.random() < 0.6; // wide screens: more left/right traffic
      const forward = Math.random() < 0.5 ? 1 : -1;
      const mainCount = horizontal ? columns : rows;
      const crossCount = horizontal ? rows : columns;
      const toPoint = (main: number, cross: number): Point =>
        horizontal ? { x: main * spacing, y: cross * spacing } : { x: cross * spacing, y: main * spacing };

      let main = forward === 1 ? -1 : mainCount + 1;
      const end = forward === 1 ? mainCount + 1 : -1;
      let cross = randomInt(1, Math.max(1, crossCount - 1));
      const points = [toPoint(main, cross)];

      while ((end - main) * forward > 0) {
        main = clampTo(main + forward * randomInt(2, 6), end, forward);
        points.push(toPoint(main, cross));
        if ((end - main) * forward > 1 && Math.random() < 0.65) {
          const step = (Math.random() < 0.5 ? -1 : 1) * randomInt(1, 3);
          cross = Math.min(Math.max(cross + step, 1), Math.max(1, crossCount - 1));
          points.push(toPoint(main, cross));
        }
      }
      return dedupe(points);
    }

    function createSignal(initial: boolean): Signal {
      const path = planPath();
      const lengths = [0];
      for (let index = 1; index < path.length; index++) {
        lengths.push(lengths[index - 1]! + distanceBetween(path[index - 1]!, path[index]!));
      }
      const total = lengths.at(-1)!;
      return {
        path,
        lengths,
        // The first signals start part-way along, so the screen isn't empty at first.
        distance: initial ? random(0, total * 0.8) : 0,
        speed: random(...config.speed),
        delay: initial ? 0 : random(0.2, 2.2),
        nextCorner: 1,
      };
    }

    function pointAt(signal: Signal, distance: number): Point {
      const { path, lengths } = signal;
      if (distance <= 0) return path[0]!;
      for (let index = 1; index < path.length; index++) {
        if (distance <= lengths[index]!) {
          const start = path[index - 1]!;
          const end = path[index]!;
          const t = (distance - lengths[index - 1]!) / (lengths[index]! - lengths[index - 1]! || 1);
          return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
        }
      }
      return path.at(-1)!;
    }

    /** The path between two distances, including any corners in between. */
    function stretch(signal: Signal, from: number, to: number): Point[] {
      const points = [pointAt(signal, from)];
      signal.lengths.forEach((length, index) => {
        if (length > from && length < to) points.push(signal.path[index]!);
      });
      points.push(pointAt(signal, to));
      return points;
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      columns = Math.ceil(width / config.spacing);
      rows = Math.ceil(height / config.spacing);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      readColors();
      drawGrid();
      signals = Array.from({ length: config.signals }, () => createSignal(true));
      flashes = [];
      paint(performance.now());
    }

    function paint(now: number) {
      if (width < 1 || height < 1) return;
      context!.setTransform(1, 0, 0, 1, 0, 0);
      context!.clearRect(0, 0, canvas!.width, canvas!.height);
      context!.drawImage(gridCanvas, 0, 0);
      if (reducedMotion) return;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.lineCap = 'round';
      context!.lineJoin = 'round';

      // Corners flashing as a signal turns them.
      flashes = flashes.filter((flash) => now - flash.born < 700);
      for (const flash of flashes) {
        const progress = (now - flash.born) / 700;
        context!.strokeStyle = `rgba(${signalRgb}, ${0.45 * (1 - progress)})`;
        context!.lineWidth = 1.5;
        context!.beginPath();
        context!.arc(flash.x, flash.y, 3 + progress * 8, 0, Math.PI * 2);
        context!.stroke();
      }

      for (const signal of signals) {
        if (signal.delay > 0) continue;
        const total = signal.lengths.at(-1)!;
        const head = Math.min(signal.distance, total);
        const tail = Math.max(0, signal.distance - config.trail);
        if (tail >= total) continue;

        // The lit wire behind the signal, fading towards its tail.
        const wire = stretch(signal, tail, head);
        const tailPoint = wire[0]!;
        const headPoint = wire.at(-1)!;
        const gradient = context!.createLinearGradient(tailPoint.x, tailPoint.y, headPoint.x, headPoint.y);
        gradient.addColorStop(0, `rgba(${signalRgb}, 0)`);
        gradient.addColorStop(1, `rgba(${signalRgb}, ${config.wireAlpha})`);
        context!.strokeStyle = gradient;
        context!.lineWidth = 1.75;
        context!.beginPath();
        wire.forEach((point, index) => (index === 0 ? context!.moveTo(point.x, point.y) : context!.lineTo(point.x, point.y)));
        context!.stroke();

        if (signal.distance <= total) {
          // The signal itself: a dot with a soft halo.
          context!.fillStyle = `rgba(${signalRgb}, 0.16)`;
          context!.beginPath();
          context!.arc(headPoint.x, headPoint.y, 7, 0, Math.PI * 2);
          context!.fill();
          context!.fillStyle = `rgba(${signalRgb}, 0.95)`;
          context!.beginPath();
          context!.arc(headPoint.x, headPoint.y, 2.75, 0, Math.PI * 2);
          context!.fill();
        }
      }
    }

    function tick(now: number) {
      const elapsed = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      signals = signals.map((signal) => {
        if (signal.delay > 0) {
          signal.delay -= elapsed;
          return signal;
        }
        signal.distance += signal.speed * elapsed;
        // Flash each corner as the signal reaches it.
        while (signal.nextCorner < signal.path.length - 1 && signal.distance >= signal.lengths[signal.nextCorner]!) {
          const corner = signal.path[signal.nextCorner]!;
          if (corner.x >= 0 && corner.x <= width && corner.y >= 0 && corner.y <= height) flashes.push({ ...corner, born: now });
          signal.nextCorner++;
        }
        const finished = signal.distance - config.trail > signal.lengths.at(-1)!;
        return finished ? createSignal(false) : signal;
      });
      paint(now);
      frame = requestAnimationFrame(tick);
    }

    function start() {
      if (reducedMotion || frame || !isVisible || document.hidden || width < 1) return;
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    resize();
    start();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      start();
    });
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? true;
      if (isVisible) start();
      else stop();
    });
    visibilityObserver.observe(canvas);

    const onVisibilityChange = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Redraw in the new colors when the theme changes.
    const themeObserver = new MutationObserver(() => {
      readColors();
      drawGrid();
      paint(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [variant]);

  return <canvas ref={canvasRef} aria-hidden className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} />;
}

function clampTo(value: number, end: number, direction: number) {
  return direction === 1 ? Math.min(value, end) : Math.max(value, end);
}

function distanceBetween(a: Point, b: Point) {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

function dedupe(points: Point[]) {
  return points.filter((point, index) => index === 0 || point.x !== points[index - 1]!.x || point.y !== points[index - 1]!.y);
}

/** "#3355ff" or "rgb(51 85 255)" -> "51, 85, 255" */
function toRgb(color: string): string | null {
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const value = parseInt(hex[1]!, 16);
    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
  }
  const rgb = color.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  return rgb ? `${rgb[1]}, ${rgb[2]}, ${rgb[3]}` : null;
}
