import type {
  CalendarSourceName,
  EventSourceName,
} from "@/domain/calendarSources";

// Google Calendar IDs used by the app. Keys of PARISH_EVENT_CALENDARS become
// the `source` on each event and drive colours and notification settings.

export const GOOGLE_CALENDAR_API_BASE_URL =
  "https://www.googleapis.com/calendar/v3/calendars";

export interface GoogleCalendarSource<
  S extends EventSourceName = EventSourceName,
> {
  source: S;
  calendarId: string;
}

type ParishCalendarSource = GoogleCalendarSource<CalendarSourceName>;

export const PARISH_EVENT_CALENDARS: ParishCalendarSource[] = [
  { source: "youth", calendarId: "stpaulsyouthcommittee@gmail.com" },
  {
    source: "weekly",
    calendarId:
      "741ba56a83de39122a2e925afc43375398a3a545958020239e5330919b8e619b@group.calendar.google.com",
  },
  {
    source: "church",
    calendarId:
      "76dbf5b94329167ce98a45e41ee7ac1e05c802133d177e45c7e1491f49d09855@group.calendar.google.com",
  },
  {
    source: "family",
    calendarId:
      "8863a8ef51cfab639c8f95bdf27d159e294e48977be6c617a0d2597cf36348c3@group.calendar.google.com",
  },
  {
    source: "ladies",
    calendarId:
      "7bb4456a4e8533e9ee041bb5200963daa89da85ecb82c043407778ed08be9e33@group.calendar.google.com",
  },
  {
    source: "parish",
    calendarId:
      "db3b93533ec6a617c87a9ab3355fa9ab45184f9f44b4bc7892aee7da9681a6bb@group.calendar.google.com",
  },
  {
    source: "seniors",
    calendarId:
      "cfff8a16f87faa4f805d29cf02988ac51ac509f95527c32b2462c16b1e1d5a39@group.calendar.google.com",
  },
  {
    source: "playgroup",
    calendarId:
      "132b3c000939be571646c383230441cc57a01ebe1654c7cdd4734f0b7bdab703@group.calendar.google.com",
  },
  {
    source: "fellowship",
    calendarId:
      "8e6705cdcd699fd9ad2b7444471054d2246c77cd918d04233742bb601e8cd71f@group.calendar.google.com",
  },
];

export const FASTING_CALENDAR: GoogleCalendarSource = {
  source: "fasting",
  calendarId:
    "6bd3ab94f1acd2b24f227faf63a4beda9f791587d0c0f339878e0ceca8a53481@group.calendar.google.com",
};

export const SAINTS_CALENDAR: GoogleCalendarSource = {
  source: "saints",
  calendarId:
    "1c40cab36e5f35e50272edbc14b3dd69f9fd2b41b34986b9ada9789d9021bc1d@group.calendar.google.com",
};
