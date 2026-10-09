import { getParishDateParts, isSameParishMonth } from "@/lib/parishTime";
import { formatMonthHeading } from "./dateUtils";
import { EventData } from "../types";

export type GroupedEventSection = {
  title: string;
  weekLabel?: string;
  data: EventData[];
};

export type HomeEventSection = GroupedEventSection & { sectionIndex: number };

export const getSaintsTitle = (todaysSaints: string[]): string =>
  todaysSaints.length > 1 ? "Today we Commemorate" : "Today we Commemorate";

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

export type MonthOption = {
  label: string;
  // An instant inside the month, ready to hand back as the month filter.
  date: Date;
  isSelected: boolean;
};

const MONTH_OPTION_LIMIT = 12;

const monthKey = (date: Date): number => {
  const { year, month } = getParishDateParts(date);
  return year * 12 + month;
};

// The months the Home filter menu offers: those with events, in order, up to the
// limit. The selected month always stays listed so its tick can be seen and cleared.
export const getMonthOptions = (
  groupedEvents: GroupedEventSection[],
  selectedMonth: Date | null,
  limit = MONTH_OPTION_LIMIT,
): MonthOption[] => {
  const months = new Map<number, Date>();

  for (const section of groupedEvents) {
    for (const item of section.data) {
      const start = new Date(item.start);
      const key = monthKey(start);
      if (!months.has(key)) {
        months.set(key, start);
      }
    }
  }

  const selectedKey = selectedMonth ? monthKey(selectedMonth) : null;
  const listed = [...months.entries()].slice(0, limit);

  if (
    selectedMonth &&
    selectedKey !== null &&
    !listed.some(([key]) => key === selectedKey)
  ) {
    listed.push([selectedKey, months.get(selectedKey) ?? selectedMonth]);
    listed.sort(([a], [b]) => a - b);
  }

  return listed.map(([key, date]) => ({
    label: formatMonthHeading(date),
    date,
    isSelected: key === selectedKey,
  }));
};
