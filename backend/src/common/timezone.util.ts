const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function normalizeTimeString(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function getTimezoneOffsetMs(timeZone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return tzDate.getTime() - utcDate.getTime();
}

export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const offsetMs = getTimezoneOffsetMs(timeZone, new Date(utcGuess));
  return new Date(utcGuess - offsetMs);
}

export function getDatePartsInTimeZone(
  instant: Date,
  timeZone: string,
): { year: number; month: number; day: number; dayOfWeek: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  const weekdayKey = (parts.weekday ?? 'Sun').slice(0, 3);

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    dayOfWeek: WEEKDAY_TO_INDEX[weekdayKey] ?? 0,
  };
}

export function addCalendarDaysInTimeZone(
  year: number,
  month: number,
  day: number,
  daysToAdd: number,
  timeZone: string,
): { year: number; month: number; day: number; dayOfWeek: number } {
  const anchor = zonedTimeToUtc(year, month, day, 12, 0, timeZone);
  const next = new Date(anchor.getTime() + daysToAdd * 86_400_000);
  return getDatePartsInTimeZone(next, timeZone);
}
