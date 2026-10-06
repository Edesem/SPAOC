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

const dateFormat = (withYear: boolean): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: withYear ? "numeric" : undefined,
  });

// The day (or days) an event falls on, e.g. "Saturday 15 August". The year is
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

  const first = format.format(startDate);
  if (parishDayKey(lastDay) <= parishDayKey(startDate)) return first;

  return `${first} to ${format.format(lastDay)}`;
};
