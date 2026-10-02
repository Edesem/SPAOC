import { getCalendarApiKey } from "@/config/env";
import type { CalendarDataService } from "./CalendarDataService";
import { GoogleCalendarService } from "./GoogleCalendarService";

export * from "./CalendarDataService";

// App-wide calendar data service. Swap the implementation here to change
// provider without touching screens or hooks.
export const calendarService: CalendarDataService = new GoogleCalendarService({
  apiKey: getCalendarApiKey(),
});
