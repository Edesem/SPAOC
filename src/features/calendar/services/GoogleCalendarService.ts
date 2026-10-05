import { endOfParishDay, now, startOfParishDay } from "@/lib/parishTime";
import type { CalendarDataService, CalendarEvent } from "./CalendarDataService";
import {
  FASTING_CALENDAR,
  GOOGLE_CALENDAR_API_BASE_URL,
  PARISH_EVENT_CALENDARS,
  SAINTS_CALENDAR,
  type GoogleCalendarSource,
} from "./googleCalendarConfig";
import {
  byStartTime,
  isPrivateEvent,
  normalizeGoogleEvent,
  type GoogleCalendarEvent,
  type GoogleCalendarEventsResponse,
} from "./googleCalendarMapper";

export interface GoogleCalendarConfig {
  apiKey: string;
  baseUrl?: string;
  parishCalendars?: GoogleCalendarSource[];
  fastingCalendar?: GoogleCalendarSource;
  saintsCalendar?: GoogleCalendarSource;
}

type FetchFn = (url: string) => Promise<Response>;

// Resolve fetch at call time so tests can replace the global
const defaultFetch: FetchFn = (url) => fetch(url);

// CalendarDataService backed by the public Google Calendar API v3
export class GoogleCalendarService implements CalendarDataService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly parishCalendars: GoogleCalendarSource[];
  private readonly fastingCalendar: GoogleCalendarSource;
  private readonly saintsCalendar: GoogleCalendarSource;

  constructor(
    config: GoogleCalendarConfig,
    private readonly fetchFn: FetchFn = defaultFetch,
  ) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? GOOGLE_CALENDAR_API_BASE_URL;
    this.parishCalendars = config.parishCalendars ?? PARISH_EVENT_CALENDARS;
    this.fastingCalendar = config.fastingCalendar ?? FASTING_CALENDAR;
    this.saintsCalendar = config.saintsCalendar ?? SAINTS_CALENDAR;
  }

  // A calendar that fails to load is logged and skipped so the rest still show.
  // If every calendar fails, the first error is thrown so it is not mistaken
  // for there being no events.
  async getParishEvents(from: Date = now()): Promise<CalendarEvent[]> {
    const failures: unknown[] = [];

    const results = await Promise.all(
      this.parishCalendars.map(async ({ source, calendarId }) => {
        try {
          const items = await this.listEvents(calendarId, {
            timeMin: from.toISOString(),
            orderBy: "startTime",
          });

          return items
            .filter((item) => !isPrivateEvent(item))
            .map((item) => normalizeGoogleEvent(item, source));
        } catch (error) {
          console.error(`Error fetching ${source}:`, error);
          failures.push(error);
          return [];
        }
      }),
    );

    if (
      failures.length > 0 &&
      failures.length === this.parishCalendars.length
    ) {
      throw failures[0];
    }

    return results.flat().sort(byStartTime);
  }

  async getFastingEvents(from: Date = now()): Promise<CalendarEvent[]> {
    const { source, calendarId } = this.fastingCalendar;
    const items = await this.listEvents(calendarId, {
      timeMin: from.toISOString(),
      orderBy: "startTime",
    });

    return items.map((item) => normalizeGoogleEvent(item, source));
  }

  // Rejects on failure, so a failed request is not mistaken for a day with no
  // saints. Use this where acting on "no saints" would do harm.
  async getSaintsForDateOrThrow(date: Date): Promise<string[]> {
    const items = await this.listEvents(this.saintsCalendar.calendarId, {
      timeMin: startOfParishDay(date).toISOString(),
      timeMax: endOfParishDay(date).toISOString(),
    });

    return items.map((item) => item.summary || "Unnamed Saint");
  }

  // Returns an empty list on failure so callers can treat it as "no saints"
  async getSaintsForDate(date: Date): Promise<string[]> {
    try {
      return await this.getSaintsForDateOrThrow(date);
    } catch (error) {
      console.error("Error fetching saints for", date.toDateString(), error);
      return [];
    }
  }

  private async listEvents(
    calendarId: string,
    query: Record<string, string>,
  ): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      singleEvents: "true",
      ...query,
    });
    const url = `${this.baseUrl}/${encodeURIComponent(calendarId)}/events?${params}`;

    const response = await this.fetchFn(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data: GoogleCalendarEventsResponse = await response.json();
    return data.items ?? [];
  }
}
