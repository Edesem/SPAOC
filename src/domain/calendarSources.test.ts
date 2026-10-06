import { Colours } from "@/theme/colours";
import {
  CALENDAR_SOURCES,
  CALENDAR_SOURCE_NAMES,
  DEFAULT_CALENDAR_SOURCE,
  getCalendarColour,
  getCalendarImage,
  getCalendarLabel,
} from "./calendarSources";

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

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
    expect(getCalendarColour("youth")).toBe("#5C6BC0");
    expect(getCalendarImage("youth")).toBe(CALENDAR_SOURCES[0].image);
  });

  it("labels a registered calendar by its capitalised name", () => {
    expect(getCalendarLabel("church")).toBe("Church");
  });

  it("has no label for sources that aren't parish event calendars", () => {
    expect(getCalendarLabel("fasting")).toBeUndefined();
    expect(getCalendarLabel("unknown")).toBeUndefined();
  });

  it("falls back to the default colour and image for unknown sources", () => {
    expect(getCalendarColour("fasting")).toBe(DEFAULT_CALENDAR_SOURCE.colour);
    expect(getCalendarImage("fasting")).toBe(DEFAULT_CALENDAR_SOURCE.image);
  });

  // The colour is the only mark of which calendar an event is on, so it has to
  // be visible on the card in both schemes (WCAG 3:1 for graphics).
  it.each(CALENDAR_SOURCES.map((calendar) => [calendar.name, calendar.colour]))(
    "keeps the %s colour visible on the light and dark cards",
    (_name, colour) => {
      expect(contrast(colour, Colours.light.itemBackground)).toBeGreaterThanOrEqual(3);
      expect(contrast(colour, Colours.dark.itemBackground)).toBeGreaterThanOrEqual(3);
    },
  );
});
