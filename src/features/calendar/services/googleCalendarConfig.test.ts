import { CALENDAR_SOURCE_NAMES } from "@/domain/calendarSources";
import { PARISH_EVENT_CALENDARS } from "./googleCalendarConfig";

describe("googleCalendarConfig", () => {
  it("has a Google calendar for every registered source and vice versa", () => {
    const configured = PARISH_EVENT_CALENDARS.map(({ source }) => source);

    expect([...configured].sort()).toEqual([...CALENDAR_SOURCE_NAMES].sort());
  });
});
