import {
  APP_TIME_ZONE,
  getParishDateParts,
  now,
  parishDayKey,
  startOfParishDay,
} from "@/lib/parishTime";
import type { StartOfWeek } from "@/services/settings";
import { EventData } from "../types";

export const formatDateHeading = (date: Date) => {
  const timeZone = APP_TIME_ZONE;

  const today = now();
  const todayKey = parishDayKey(today);
  const dateKey = parishDayKey(date);
  const tomorrowKey = parishDayKey(startOfParishDay(today, 1));

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

    // Convert the event date to the parish's local date string (YYYY-MM-DD)
    const dayKey = parishDayKey(eventDate);

    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }
    grouped[dayKey].push(event);
  });

  const startOfThisWeek = getStartOfWeek(now(), startOfWeek);
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
  const { weekday } = getParishDateParts(date);

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

  return startOfParishDay(date, -daysToSubtract);
};
