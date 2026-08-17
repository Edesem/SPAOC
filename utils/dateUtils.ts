import type { StartOfWeek } from "@/app/settings";
import { EventData } from "@/types/global";

const APP_TIME_ZONE = "Australia/Sydney";

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

  const tomorrow = new Date(`${todayKey}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
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
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
  const startOfLater = new Date(startOfNextWeek); // One week after "Next Week"
  startOfLater.setDate(startOfLater.getDate() + 6); // Start of "Later" label

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

export const getStartOfWeek = (date: Date, startOfWeek: StartOfWeek) => {
  const firstDay = startOfWeek == "monday" ? 2 : 1; // 2 = Monday, 1 = Sunday
  const { year, month, day, weekday } = getSydneyDateParts(date);
  date.setHours(0, 0, 0, 0); // Set time to midnight
  date.setDate(date.getDate() - day + firstDay); // Set the date to the start of the week (Monday)
  return date;
};

const getSydneyDateParts = (date: Date) => {
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
export const getCurrentDate = (): Date => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000; // Convert offset to milliseconds
  return new Date(now.getTime() - offset); // Return Date object
};
