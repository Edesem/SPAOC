import { startOfParishDayFromKey } from "@/lib/parishTime";
import type { CalendarEvent } from "./CalendarDataService";

// Subset of a Google Calendar API v3 event resource that the app reads.
// Timed events carry `dateTime`; all-day events carry `date` (YYYY-MM-DD).
export interface GoogleCalendarEventTime {
  date?: string;
  dateTime?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  visibility?: "default" | "public" | "private" | "confidential";
  start: GoogleCalendarEventTime;
  end?: GoogleCalendarEventTime;
}

export interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEvent[];
}

export const isPrivateEvent = (event: GoogleCalendarEvent): boolean =>
  event.visibility === "private";

// Google sends an all-day event's `date` as a bare YYYY-MM-DD, and its end
// date is exclusive (a one-day event ends on the next day).
const isAllDay = (event: GoogleCalendarEvent): boolean =>
  !event.start.dateTime && !!event.start.date;

const normalizeEnd = (event: GoogleCalendarEvent, allDay: boolean): string => {
  if (allDay) {
    const endDate = event.end?.dateTime ? undefined : event.end?.date;
    return endDate ? startOfParishDayFromKey(endDate).toISOString() : "";
  }
  return event.end?.dateTime || event.end?.date || "";
};

// Convert a Google event into the app's event shape. Timed events keep their
// instants. All-day events span from the parish's midnight on the start date
// to its midnight on the end date, so start and end are both ISO instants.
// Missing description and location stay undefined because the details screen
// checks for null.
export const normalizeGoogleEvent = (
  event: GoogleCalendarEvent,
  source: string,
): CalendarEvent => {
  const allDay = isAllDay(event);
  return {
    id: event.id,
    title: event.summary || "No Title",
    start: allDay
      ? startOfParishDayFromKey(event.start.date as string).toISOString()
      : new Date(event.start.dateTime as string).toISOString(),
    end: normalizeEnd(event, allDay),
    allDay,
    description: event.description as string,
    location: event.location as string,
    source,
  };
};

export const byStartTime = (a: CalendarEvent, b: CalendarEvent): number =>
  new Date(a.start).getTime() - new Date(b.start).getTime();
