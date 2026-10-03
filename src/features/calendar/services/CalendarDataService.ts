import type { EventData } from "../types";

// Provider events are normalized into the app's existing event shape so the
// UI keeps receiving the same objects it did when hooks fetched directly.
export type CalendarEvent = EventData;

// Single entry point for calendar data. Screens and hooks depend on this
// interface rather than on a specific provider.
export interface CalendarDataService {
  // Upcoming public parish events from every event calendar, sorted by start
  getParishEvents(from?: Date): Promise<CalendarEvent[]>;
  // Upcoming entries from the fasting calendar, in start order
  getFastingEvents(from?: Date): Promise<CalendarEvent[]>;
  // Names of the saints commemorated on the given day; empty if the request
  // fails
  getSaintsForDate(date: Date): Promise<string[]>;
  // The same, but rejects when the request fails, so a failure can be told
  // apart from a day with no saints
  getSaintsForDateOrThrow(date: Date): Promise<string[]>;
}
