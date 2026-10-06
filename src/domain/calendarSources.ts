import type { ImageSourcePropType } from "react-native";

// The single place that defines the parish event calendars the app knows
// about: their name (the `source` on each event and the key of their
// notification settings), colour and detail image. The Google calendar IDs
// live separately in services/calendar/googleCalendarConfig.ts and are matched
// to these names there.
export interface CalendarSource {
  name: string;
  colour: string;
  image: ImageSourcePropType;
}

// Order matters: it is the order calendars appear in the Settings screen.
// Each colour is the bar on an event row, so it keeps at least 3:1 against both
// card surfaces (white and #272727); calendarSources.test.ts checks it.
export const CALENDAR_SOURCES = [
  {
    name: "youth",
    colour: "#5C6BC0",
    image: require("@assets/images/orthodox/procession.png"),
  },
  {
    name: "church",
    colour: "#B8860B",
    image: require("@assets/images/orthodox/church.png"),
  },
  {
    name: "family",
    colour: "#0E8D4D",
    image: require("@assets/images/orthodox/village.png"),
  },
  {
    name: "ladies",
    colour: "#9E69AF",
    image: require("@assets/images/orthodox/Theotokos.png"),
  },
  {
    name: "parish",
    colour: "#F4511E",
    image: require("@assets/images/orthodox/parish.png"),
  },
  {
    name: "seniors",
    colour: "#7986CB",
    image: require("@assets/images/orthodox/icon towel.png"),
  },
  {
    name: "weekly",
    colour: "#039BE5",
    image: require("@assets/images/orthodox/icon corner.png"),
  },
  {
    name: "playgroup",
    colour: "#9575CD",
    image: require("@assets/images/orthodox/annunciation.png"),
  },
  {
    name: "fellowship",
    colour: "#489160",
    image: require("@assets/images/orthodox/fellowship.png"),
  },
] as const satisfies readonly CalendarSource[];

// The parish event calendar names, derived from the registry above so a typo
// fails the typecheck.
export type CalendarSourceName = (typeof CALENDAR_SOURCES)[number]["name"];

// Every value an event's `source` can take: the registry plus the fasting and
// saints calendars, which are not parish event calendars.
export type EventSourceName = CalendarSourceName | "fasting" | "saints";

// Used for events whose source is not in CALENDAR_SOURCES (for example the
// fasting and saints calendars).
export const DEFAULT_CALENDAR_SOURCE: Omit<CalendarSource, "name"> = {
  colour: "#000",
  image: require("@assets/images/orthodox/church.png"),
};

export const CALENDAR_SOURCE_NAMES: readonly CalendarSourceName[] =
  CALENDAR_SOURCES.map((calendar) => calendar.name);

const findCalendarSource = (name: string) =>
  CALENDAR_SOURCES.find((calendar) => calendar.name === name);

export const getCalendarColour = (name: string): string =>
  findCalendarSource(name)?.colour ?? DEFAULT_CALENDAR_SOURCE.colour;

export const getCalendarImage = (name: string): ImageSourcePropType =>
  findCalendarSource(name)?.image ?? DEFAULT_CALENDAR_SOURCE.image;
