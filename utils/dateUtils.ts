import type { StartOfWeek } from "@/app/settings";
import { EventData } from "@/types/global";

const APP_TIME_ZONE = "Australia/Melbourne";

export const formatDateHeading = (date: Date) => {
  const timeZone = APP_TIME_ZONE;

  const getDateKey = (value: Date) =>
    value.toLocaleDateString("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const todayKey = getDateKey(new Date());
  const dateKey = getDateKey(date);

  const [year, month, day] = todayKey.split("-").map(Number);
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1, 12));
  const tomorrowKey = getDateKey(tomorrow);

  if (dateKey === todayKey) {
    return `Today, ${date.toLocaleDateString("en-AU", {
      timeZone,
      day: "numeric",
      month: "long",
    })}`;
  } else if (dateKey === tomorrowKey) {
    return `Tomorrow, ${date.toLocaleDateString("en-AU", {
      timeZone,
      day: "numeric",
      month: "long",
    })}`;
  } else {
    return `${date.toLocaleDateString("en-AU", {
      timeZone,
      weekday: "long",
    })}, ${date.toLocaleDateString("en-AU", {
      timeZone,
      day: "numeric",
      month: "long",
    })}`;
  }
};

export const groupEventsByDay = (
  events: EventData[],
  startOfWeek: StartOfWeek,
) => {
  const grouped: { [key: string]: EventData[] } = {};

  events.forEach((event) => {
    // Parse the event start time into a Date object
    const eventDate = new Date(event.start);

    // Convert the event date to Australian local date string (YYYY-MM-DD format)
    const dayKey = eventDate.toLocaleDateString("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }
    grouped[dayKey].push(event);
  });

  const today = new Date();
  const startOfThisWeek = getStartOfWeek(today, startOfWeek);
  const startOfNextWeek = new Date(startOfThisWeek);
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
  const startOfLater = new Date(startOfNextWeek); // One week after "Next Week"
  startOfLater.setDate(startOfLater.getDate() + 7); // Start of "Later" label

  let addedThisWeekLabel = false;
  let addedNextWeekLabel = false;
  let addedLaterLabel = false; // Flag for "Later" label

  // Transform the grouped object into an array with formatted titles
  return Object.keys(grouped)
    .sort() // Sort by date
    .map((key) => {
      const date = new Date(key);

      // Determine the week label
      let weekLabel;
      if (date < startOfThisWeek) {
        weekLabel = undefined; // Events before the current week
      } else if (date >= startOfThisWeek && date < startOfNextWeek) {
        // Assign "This Week" label only once
        if (!addedThisWeekLabel) {
          weekLabel = "This Week";
          addedThisWeekLabel = true;
        }
      } else if (date >= startOfNextWeek && date < startOfLater) {
        // Assign "Next Week" label only once
        if (!addedNextWeekLabel) {
          weekLabel = "Next Week";
          addedNextWeekLabel = true;
        }
      } else if (date >= startOfLater) {
        // Assign "Later" label only once
        if (!addedLaterLabel) {
          weekLabel = "Later";
          addedLaterLabel = true;
        }
      }

      return {
        title: formatDateHeading(date),
        weekLabel,
        data: grouped[key],
      };
    })
    .filter((section) => section.data.length > 0); // Remove empty sections
};

export const getStartOfWeek = (date: Date, startOfWeek: StartOfWeek): Date => {
  const { year, month, day, weekday } = getDateParts(date);

  const weekdayIndex = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ].indexOf(weekday);

  const daysToSubtract =
    startOfWeek === "sunday"
      ? weekdayIndex
      : weekdayIndex === 0
        ? 6
        : weekdayIndex - 1;

  const targetDate = new Date(Date.UTC(year, month - 1, day - daysToSubtract));

  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    timeZoneName: "longOffset",
  });

  const offsetPart = offsetFormatter
    .formatToParts(targetDate)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!offsetPart) {
    throw new Error(`Unable to determine timezone offset for ${APP_TIME_ZONE}`);
  }

  const match = offsetPart.match(/^GMT([+-])(\d{2}):?(\d{2})?$/);

  if (!match) {
    throw new Error(`Unexpected timezone offset: ${offsetPart}`);
  }

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  const offsetMinutes = sign * (hours * 60 + minutes);

  return new Date(targetDate.getTime() - offsetMinutes * 60_000);
};

const getDateParts = (date: Date) => {
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

// Function to fetch current date in 'YYYY-MM-DD' format
// TODO: Remove this function and use new Date() directly in the future after we have more test coverage
export const getCurrentDate = (): Date => {
  return new Date();
};
