import { APP_TIME_ZONE } from "@/lib/parishTime";

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
