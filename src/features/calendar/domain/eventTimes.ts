import { APP_TIME_ZONE, now, parishDayKey } from "@/lib/parishTime";

// Parish time, to match the day each event is grouped under.
const timeFormat: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
};

// The start and end labels shown on an event row and on its details screen.
export const formatEventTimes = (
  start: string,
  end: string,
  allDay: boolean,
): { start: string; end: string } => {
  if (allDay) return { start: "All day", end: "" };

  return {
    start: new Date(start).toLocaleTimeString([], timeFormat),
    end: `to ${new Date(end).toLocaleTimeString([], timeFormat)}`,
  };
};

const clockFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: APP_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// "7:00" and "pm" for an instant, in parish time. The period is built from
// the parts so it is always lower case, whatever the platform's ICU returns.
const clockParts = (date: Date): { clock: string; period: string } => {
  const parts = clockFormat.formatToParts(date);
  const part = (type: string) =>
    parts.find((entry) => entry.type === type)?.value ?? "";

  return {
    clock: `${part("hour")}:${part("minute")}`,
    period: part("dayPeriod").toLowerCase(),
  };
};

// The times on the details screen as one line: "7:00 \u2013 8:30 pm", with am or
// pm written once when both times share it on the same parish day, and on both
// when they don't ("10:00 am \u2013 12:00 pm").
export const formatEventTimeRange = (
  start: string,
  end: string,
  allDay: boolean,
): string => {
  if (allDay) return "All day";

  const startDate = new Date(start);
  const first = clockParts(startDate);
  if (!end || end === start) return `${first.clock} ${first.period}`;

  const endDate = new Date(end);
  const last = clockParts(endDate);
  const sharesPeriod =
    first.period === last.period &&
    parishDayKey(startDate) === parishDayKey(endDate);

  return sharesPeriod
    ? `${first.clock} \u2013 ${last.clock} ${last.period}`
    : `${first.clock} ${first.period} \u2013 ${last.clock} ${last.period}`;
};

const dateFormat = (withYear: boolean): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: withYear ? "numeric" : undefined,
  });

// en-AU writes "Saturday 15 August"; the details screen sets the weekday off
// with a comma, "Saturday, 15 August".
const withWeekdayComma = (format: Intl.DateTimeFormat, date: Date): string => {
  const parts = format.formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday");
  if (!weekday) return format.format(date);

  const rest = parts
    .filter((part) => part !== weekday)
    .map((part) => part.value)
    .join("")
    .trim();

  return `${weekday.value}, ${rest}`;
};

// The day (or days) an event falls on, e.g. "Saturday, 15 August". The year is
// added only when it isn't the current year. An all-day event's end is the
// start of the day after it finishes, so its last day is a millisecond earlier.
export const formatEventDate = (
  start: string,
  end: string,
  allDay: boolean,
): string => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : startDate;
  const lastDay = allDay ? new Date(endDate.getTime() - 1) : endDate;
  const withYear =
    parishDayKey(startDate).slice(0, 4) !== parishDayKey(now()).slice(0, 4);
  const format = dateFormat(withYear);

  const first = withWeekdayComma(format, startDate);
  if (parishDayKey(lastDay) <= parishDayKey(startDate)) return first;

  return `${first} to ${withWeekdayComma(format, lastDay)}`;
};
