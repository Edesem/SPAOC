import {
  CALENDAR_SOURCES,
  CALENDAR_SOURCE_NAMES,
  DEFAULT_CALENDAR_SOURCE,
  getCalendarColour,
  getCalendarImage,
} from "./calendarSources";

describe("calendarSources", () => {
  it("lists calendars in the order the Settings screen shows them", () => {
    expect(CALENDAR_SOURCE_NAMES).toEqual([
      "youth",
      "church",
      "family",
      "ladies",
      "parish",
      "seniors",
      "weekly",
      "playgroup",
      "fellowship",
    ]);
  });

  it("defines each calendar name only once", () => {
    expect(new Set(CALENDAR_SOURCE_NAMES).size).toBe(CALENDAR_SOURCES.length);
  });

  it("returns the colour and image of a registered calendar", () => {
    expect(getCalendarColour("youth")).toBe("#3F51B5");
    expect(getCalendarImage("youth")).toBe(CALENDAR_SOURCES[0].image);
  });

  it("falls back to the default colour and image for unknown sources", () => {
    expect(getCalendarColour("fasting")).toBe(DEFAULT_CALENDAR_SOURCE.colour);
    expect(getCalendarImage("fasting")).toBe(DEFAULT_CALENDAR_SOURCE.image);
  });
});
