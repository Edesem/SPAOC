// The parish's calendar is Melbourne's, whatever the device's time zone is.
// Every "which day is it" question goes through here so it gets one answer.
export const APP_TIME_ZONE = "Australia/Melbourne";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const defaultNow = () => new Date();
let currentNow: () => Date = defaultNow;

// The app's clock. Code that needs "now" calls this rather than `new Date()`,
// so tests can pin the time with `setNow` instead of faking global timers.
export const now = (): Date => currentNow();
export const setNow = (clock: () => Date): void => {
  currentNow = clock;
};
export const resetNow = (): void => {
  currentNow = defaultNow;
};

export type ParishDateParts = {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: string; // e.g. "Thursday"
};

export const getParishDateParts = (date: Date): ParishDateParts => {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
  }).formatToParts(date);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    weekday: getPart("weekday"),
  };
};

// "YYYY-MM-DD" for the parish day the instant falls on.
export const parishDayKey = (date: Date): string => {
  const { year, month, day } = getParishDateParts(date);
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
};

// How far the parish's wall clock is ahead of UTC at the given instant.
// This reads the wall-clock components instead of relying on
// `timeZoneName: "longOffset"`, which can return just "GMT" on some runtimes.
const parishOffsetMs = (instant: Date): number => {
  const wholeSeconds = Math.floor(instant.getTime() / 1000) * 1000;
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(wholeSeconds));

  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const wallAsUtc = Date.UTC(
    getPart("year"),
    getPart("month") - 1,
    getPart("day"),
    getPart("hour"),
    getPart("minute"),
    getPart("second"),
  );

  return wallAsUtc - wholeSeconds;
};

// The instant at which the parish's wall clock reads the given date and hour.
// Day overflow is fine (day 0 is the last day of the previous month). The
// offset is read twice because it can differ between the wall-clock reading
// and the instant it maps to when a daylight saving change falls in between.
const parishWallClockToDate = (
  year: number,
  month: number,
  day: number,
  hour: number,
): Date => {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour);
  const firstGuess = wallAsUtc - parishOffsetMs(new Date(wallAsUtc));
  return new Date(wallAsUtc - parishOffsetMs(new Date(firstGuess)));
};

// Midnight at the start of the parish day, `dayOffset` days after the day the
// instant falls on.
export const startOfParishDay = (date: Date, dayOffset = 0): Date => {
  const { year, month, day } = getParishDateParts(date);
  return parishWallClockToDate(year, month, day + dayOffset, 0);
};

// The last millisecond of the parish day.
export const endOfParishDay = (date: Date): Date =>
  new Date(startOfParishDay(date, 1).getTime() - 1);

// The given hour on the parish day `dayOffset` days after the instant's day,
// e.g. `atParishHour(date, 9, -5)` is 9am five days before.
export const atParishHour = (
  date: Date,
  hour: number,
  dayOffset = 0,
): Date => {
  const { year, month, day } = getParishDateParts(date);
  return parishWallClockToDate(year, month, day + dayOffset, hour);
};

export const isSameParishMonth = (a: Date, b: Date): boolean => {
  const partsA = getParishDateParts(a);
  const partsB = getParishDateParts(b);
  return partsA.year === partsB.year && partsA.month === partsB.month;
};

// Whole parish calendar days from one instant's day to another's. Counting
// calendar days rather than 24-hour spans keeps daylight saving days at one.
export const parishDaysBetween = (from: Date, to: Date): number => {
  const a = getParishDateParts(from);
  const b = getParishDateParts(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) -
      Date.UTC(a.year, a.month - 1, a.day)) /
      MS_PER_DAY,
  );
};
