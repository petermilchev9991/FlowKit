/**
 * When should a scheduled workflow run next? Pure functions, no database.
 *
 * Times are wall-clock times in the schedule's time zone (an IANA name such
 * as "Europe/London"), so "every day at 09:00" stays at 09:00 across
 * daylight-saving changes.
 */

export type Frequency = 'minutes' | 'hourly' | 'daily' | 'weekly';

export type ScheduleSettings = {
  frequency?: Frequency | string;
  /** For "minutes": minutes between runs (5 to 720). */
  everyMinutes?: number | string;
  /** For "hourly": minute past the hour (0 to 59). */
  minute?: number | string;
  /** For "daily" and "weekly": time of day, "HH:MM" (24-hour). */
  time?: string;
  /** For "weekly": day of the week. */
  weekday?: Weekday | string;
  /** IANA time zone; UTC when empty. */
  timezone?: string;
};

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const MIN_INTERVAL_MINUTES = 5;
export const MAX_INTERVAL_MINUTES = 720;

export class ScheduleError extends Error {}

/** Checks the settings and returns a description of a problem, or null if they're fine. */
export function validateSchedule(settings: ScheduleSettings): string | null {
  try {
    normalize(settings);
    return null;
  } catch (error) {
    return error instanceof ScheduleError ? error.message : String(error);
  }
}

/** The first run time strictly after `after`. */
export function nextRunAfter(settings: ScheduleSettings, after: Date): Date {
  const schedule = normalize(settings);
  const afterMs = after.getTime();

  if (schedule.frequency === 'minutes') {
    const step = schedule.everyMinutes * 60_000;
    return new Date(Math.floor(afterMs / step) * step + step);
  }

  // Walk forward through wall-clock hours or days in the time zone and take the first match.
  const start = zonedParts(after, schedule.timezone);
  if (schedule.frequency === 'hourly') {
    for (let hourOffset = 0; hourOffset <= 26; hourOffset++) {
      const candidate = zonedToUtc(
        { year: start.year, month: start.month, day: start.day, hour: start.hour + hourOffset, minute: schedule.minute },
        schedule.timezone,
      );
      if (candidate.getTime() > afterMs) return candidate;
    }
  } else {
    for (let dayOffset = 0; dayOffset <= 8; dayOffset++) {
      const candidate = zonedToUtc(
        { year: start.year, month: start.month, day: start.day + dayOffset, hour: schedule.hour, minute: schedule.minute },
        schedule.timezone,
      );
      if (candidate.getTime() <= afterMs) continue;
      if (schedule.frequency === 'weekly' && zonedParts(candidate, schedule.timezone).weekday !== schedule.weekday) continue;
      return candidate;
    }
  }
  throw new ScheduleError('Could not work out the next run time.');
}

/** Short human description, for example "Every Monday at 09:00 (Europe/London)". */
export function describeSchedule(settings: ScheduleSettings): string {
  const schedule = normalize(settings);
  const zone = schedule.timezone === 'UTC' ? 'UTC' : schedule.timezone;
  const time = `${pad(schedule.hour)}:${pad(schedule.minute)}`;
  switch (schedule.frequency) {
    case 'minutes':
      return `Every ${schedule.everyMinutes} minutes`;
    case 'hourly':
      return `Every hour at :${pad(schedule.minute)} (${zone})`;
    case 'daily':
      return `Every day at ${time} (${zone})`;
    case 'weekly':
      return `Every ${capitalize(schedule.weekday)} at ${time} (${zone})`;
  }
}

/* -------------------------------------------------------------------------- */

type Normalized = {
  frequency: Frequency;
  everyMinutes: number;
  minute: number;
  hour: number;
  weekday: Weekday;
  timezone: string;
};

function normalize(settings: ScheduleSettings): Normalized {
  const frequency = (settings.frequency ?? 'daily') as Frequency;
  if (!['minutes', 'hourly', 'daily', 'weekly'].includes(frequency)) throw new ScheduleError('Choose how often to run.');

  const timezone = (settings.timezone ?? '').trim() || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new ScheduleError(`"${timezone}" is not a time zone. Use a name like Europe/London or America/New_York.`);
  }

  const everyMinutes = Number(settings.everyMinutes ?? 15);
  if (frequency === 'minutes' && (!Number.isInteger(everyMinutes) || everyMinutes < MIN_INTERVAL_MINUTES || everyMinutes > MAX_INTERVAL_MINUTES)) {
    throw new ScheduleError(`Run every ${MIN_INTERVAL_MINUTES} to ${MAX_INTERVAL_MINUTES} minutes.`);
  }

  let hour = 9;
  let minute = Number(settings.minute ?? 0);
  if (frequency === 'daily' || frequency === 'weekly') {
    const match = String(settings.time ?? '09:00').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) throw new ScheduleError('Write the time as HH:MM, for example 09:30.');
    hour = Number(match[1]);
    minute = Number(match[2]);
    if (hour > 23 || minute > 59) throw new ScheduleError('Write the time as HH:MM, for example 09:30.');
  } else if (frequency === 'hourly' && (!Number.isInteger(minute) || minute < 0 || minute > 59)) {
    throw new ScheduleError('Choose a minute between 0 and 59.');
  }

  const weekday = String(settings.weekday ?? 'monday').toLowerCase() as Weekday;
  if (frequency === 'weekly' && !WEEKDAYS.includes(weekday)) throw new ScheduleError('Choose a day of the week.');

  return { frequency, everyMinutes, minute, hour, weekday, timezone };
}

type WallTime = { year: number; month: number; day: number; hour: number; minute: number };

/** Wall-clock date and time of an instant in a time zone. */
function zonedParts(date: Date, timeZone: string): WallTime & { weekday: Weekday } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'long',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: String(parts.weekday).toLowerCase() as Weekday,
  };
}

/** The instant when the clock in `timeZone` shows the given wall time. Overflowing fields roll over. */
function zonedToUtc(wall: WallTime, timeZone: string): Date {
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  const firstOffset = offsetAt(guess, timeZone);
  const result = guess - firstOffset;
  // Around daylight-saving changes the offset at the result can differ; correct once.
  const secondOffset = offsetAt(result, timeZone);
  return new Date(secondOffset === firstOffset ? result : guess - secondOffset);
}

function offsetAt(instant: number, timeZone: string) {
  const wall = zonedParts(new Date(instant), timeZone);
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  return asUtc - Math.floor(instant / 60_000) * 60_000;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
