import { CALENDAR_SOURCE_NAMES } from "@/domain/calendarSources";
import {
  PARISH_EVENT_CALENDARS,
  type GoogleCalendarSource,
} from "./googleCalendarConfig";

describe("googleCalendarConfig", () => {
  it("has a Google calendar for every registered source and vice versa", () => {
    const configured = PARISH_EVENT_CALENDARS.map(({ source }) => source);

    expect([...configured].sort()).toEqual([...CALENDAR_SOURCE_NAMES].sort());
  });

  it("rejects a calendar whose source is not a known name", () => {
    // @ts-expect-error a typo is not a calendar
    const typo: GoogleCalendarSource = { source: "yuoth", calendarId: "x" };

    expect(typo.calendarId).toBe("x");
  });
});
