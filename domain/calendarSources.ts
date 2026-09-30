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
export const CALENDAR_SOURCES: readonly CalendarSource[] = [
  {
    name: "youth",
    colour: "#3F51B5",
    image: require("../assets/images/orthodox/procession.png"),
  },
  {
    name: "church",
    colour: "#F6BF26",
    image: require("../assets/images/orthodox/church.png"),
  },
  {
    name: "family",
    colour: "#0B8043",
    image: require("../assets/images/orthodox/village.png"),
  },
  {
    name: "ladies",
    colour: "#9E69AF",
    image: require("../assets/images/orthodox/Theotokos.png"),
  },
  {
    name: "parish",
    colour: "#F4511E",
    image: require("../assets/images/orthodox/parish.png"),
  },
  {
    name: "seniors",
    colour: "#7986CB",
    image: require("../assets/images/orthodox/icon towel.png"),
  },
  {
    name: "weekly",
    colour: "#039BE5",
    image: require("../assets/images/orthodox/icon corner.png"),
  },
  {
    name: "playgroup",
    colour: "#ae9cce",
    image: require("../assets/images/orthodox/annunciation.png"),
  },
  {
    name: "fellowship",
    colour: "#489160",
    image: require("../assets/images/orthodox/fellowship.png"),
  },
];

// Used for events whose source is not in CALENDAR_SOURCES (for example the
// fasting and saints calendars).
export const DEFAULT_CALENDAR_SOURCE: Omit<CalendarSource, "name"> = {
  colour: "#000",
  image: require("../assets/images/orthodox/church.png"),
};

export const CALENDAR_SOURCE_NAMES: readonly string[] = CALENDAR_SOURCES.map(
  (calendar) => calendar.name,
);

const findCalendarSource = (name: string) =>
  CALENDAR_SOURCES.find((calendar) => calendar.name === name);

export const getCalendarColour = (name: string): string =>
  findCalendarSource(name)?.colour ?? DEFAULT_CALENDAR_SOURCE.colour;

export const getCalendarImage = (name: string): ImageSourcePropType =>
  findCalendarSource(name)?.image ?? DEFAULT_CALENDAR_SOURCE.image;
