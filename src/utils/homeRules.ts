import { isSameParishMonth } from "@/lib/parishTime";
import { EventData } from "@/types/global";

export type GroupedEventSection = {
  title: string;
  weekLabel?: string;
  data: EventData[];
};

export type HomeEventSection = GroupedEventSection & { sectionIndex: number };

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
