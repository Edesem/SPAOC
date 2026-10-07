import { isSameParishMonth } from "@/lib/parishTime";
import { EventData } from "../types";

export type GroupedEventSection = {
  title: string;
  weekLabel?: string;
  data: EventData[];
};

export type HomeEventSection = GroupedEventSection & { sectionIndex: number };

export const getSaintsTitle = (todaysSaints: string[]): string =>
  todaysSaints.length > 1 ? "Today we Commemorate" : "Today we Commemorate:";

const LOAD_SOURCE_LABELS = {
  events: "events",
  saints: "today's feast",
  fast: "the fast",
} as const;

// One non-blocking message for whichever Home sources failed to load, or null
// when none did. Each value is that source's error, null if it loaded.
export const getLoadErrorMessage = (
  errors: Record<keyof typeof LOAD_SOURCE_LABELS, string | null>,
): string | null => {
  const failed = (
    Object.keys(LOAD_SOURCE_LABELS) as (keyof typeof LOAD_SOURCE_LABELS)[]
  )
    .filter((source) => errors[source])
    .map((source) => LOAD_SOURCE_LABELS[source]);

  if (failed.length === 0) return null;

  const list =
    failed.length === 1
      ? failed[0]
      : `${failed.slice(0, -1).join(", ")} and ${failed[failed.length - 1]}`;

  return `Couldn't load ${list}. Pull down to retry.`;
};

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
