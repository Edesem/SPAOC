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

// Convert a Google event into the app's event shape. Start is normalized to
// an ISO timestamp; end keeps the provider value. Missing description and
// location stay undefined because the details screen checks for null.
export const normalizeGoogleEvent = (
  event: GoogleCalendarEvent,
  source: string,
): CalendarEvent => ({
  id: event.id,
  title: event.summary || "No Title",
  start: new Date(
    (event.start.dateTime || event.start.date) as string,
  ).toISOString(),
  end: event.end?.dateTime || event.end?.date || "",
  description: event.description as string,
  location: event.location as string,
  source,
  data: [],
});

export const byStartTime = (a: CalendarEvent, b: CalendarEvent): number =>
  new Date(a.start).getTime() - new Date(b.start).getTime();
