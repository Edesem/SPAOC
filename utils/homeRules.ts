import { isSameParishMonth } from "@/domain/parishTime";
import { EventData } from "@/types/global";

export type GroupedEventSection = {
  title: string;
  weekLabel?: string;
  data: EventData[];
};

export type HomeEventSection = GroupedEventSection & { sectionIndex: number };

export type HomeSection = HomeEventSection | { title: string; data: never[] };

// Priority order matches the app's fasting calendar: a stricter/major fast
// always takes precedence over the others when several are in effect.
export const getMajorFastLabel = (fastEvents: string[]): string | null => {
  if (fastEvents.includes("Great Lent")) {
    return "Great Lent";
  }
  if (fastEvents.includes("The Apostles' Fast")) {
    return "The Apostles' Fast";
  }
  if (fastEvents.includes("The Theotokos Fast")) {
    return "Theotokos Fast";
  }
  if (fastEvents.includes("The Nativity Fast")) {
    return "The Nativity Fast";
  }
  return null;
};

export const getMinorFastLabel = (fastEvents: string[]): string => {
  if (fastEvents.includes("Strict Fast")) {
    return "Abstain from meat, fish, dairy, eggs, wine, olive oil";
  }
  if (fastEvents.includes("Fast")) {
    return "Abstain from meat, dairy, eggs";
  }
  if (fastEvents.includes("Meat Fast")) {
    return "Abstain from meat";
  }
  return "No Fast";
};

export const getSaintsTitle = (todaysSaints: string[]): string =>
  todaysSaints.length > 1 ? "Today's Feasts" : "Today's Feast:";

// Initial screen behaviour: with no month picked, every event section shows.
export const filterSectionsByMonth = (
  groupedEvents: GroupedEventSection[],
  selectedMonth: Date | null,
): GroupedEventSection[] => {
  if (!selectedMonth) {
    return groupedEvents;
  }

  return groupedEvents
    .map((section) => ({
      ...section,
      data: section.data.filter((item) =>
        isSameParishMonth(new Date(item.start), selectedMonth),
      ),
    }))
    .filter((section) => section.data.length > 0);
};

export const addSectionIndexes = (
  sections: GroupedEventSection[],
): HomeEventSection[] =>
  sections.map((section, index) => ({ ...section, sectionIndex: index }));

// Wraps the event sections with the static image/header sections the Home
// screen's SectionList expects at the top and bottom.
export const buildHomeSections = (
  eventSections: HomeEventSection[],
): HomeSection[] => [
  {
    title: "Top Image",
    data: [],
  },
  {
    title: "Saint of the Day",
    data: [],
  },
  ...eventSections,
  {
    title: "Bottom Image",
    data: [],
  },
];
