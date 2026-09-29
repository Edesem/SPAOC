import { EventData } from "@/types/global";
import {
  addSectionIndexes,
  buildHomeSections,
  filterSectionsByMonth,
  getSaintsTitle,
  GroupedEventSection,
} from "@/utils/homeRules";

const event = (id: string, start: string): EventData => ({
  id,
  title: `Event ${id}`,
  start,
  end: start,
  description: "",
  location: "",
  source: "source",
  data: [],
});

describe("getSaintsTitle", () => {
  it("uses the singular title for one saint", () => {
    expect(getSaintsTitle(["St. Test"])).toBe("Today's Feast:");
  });

  it("uses the plural title for multiple saints", () => {
    expect(getSaintsTitle(["St. A", "St. B"])).toBe("Today's Feasts");
  });

  it("uses the singular title when there are no saints", () => {
    expect(getSaintsTitle([])).toBe("Today's Feast:");
  });
});

describe("filterSectionsByMonth", () => {
  const groupedEvents: GroupedEventSection[] = [
    {
      title: "Day",
      data: [
        event("1", "2026-03-10T12:00:00.000Z"),
        event("2", "2026-04-10T12:00:00.000Z"),
      ],
    },
  ];

  it("returns every section unchanged when no month is selected", () => {
    expect(filterSectionsByMonth(groupedEvents, null)).toBe(groupedEvents);
  });

  it("keeps only events within the selected month and year", () => {
    const filtered = filterSectionsByMonth(
      groupedEvents,
      new Date("2026-03-15T12:00:00.000Z"),
    );

    expect(filtered).toEqual([
      {
        title: "Day",
        data: [event("1", "2026-03-10T12:00:00.000Z")],
      },
    ]);
  });

  it("uses Melbourne months at a month boundary", () => {
    // 2026-02-28T13:00Z is midnight on 1 March in Melbourne
    const boundary = [
      {
        title: "Day",
        data: [
          event("1", "2026-02-28T12:59:00.000Z"),
          event("2", "2026-02-28T13:00:00.000Z"),
        ],
      },
    ];

    expect(
      filterSectionsByMonth(boundary, new Date("2026-03-15T12:00:00.000Z")),
    ).toEqual([{ title: "Day", data: [event("2", "2026-02-28T13:00:00.000Z")] }]);
    expect(
      filterSectionsByMonth(boundary, new Date("2026-02-15T12:00:00.000Z")),
    ).toEqual([{ title: "Day", data: [event("1", "2026-02-28T12:59:00.000Z")] }]);
  });

  it("drops sections that have no events left in the selected month", () => {
    const filtered = filterSectionsByMonth(
      groupedEvents,
      new Date("2027-01-01T12:00:00.000Z"),
    );

    expect(filtered).toEqual([]);
  });
});

describe("addSectionIndexes", () => {
  it("annotates each section with its position", () => {
    const sections: GroupedEventSection[] = [
      { title: "First", data: [] },
      { title: "Second", data: [] },
    ];

    expect(addSectionIndexes(sections)).toEqual([
      { title: "First", data: [], sectionIndex: 0 },
      { title: "Second", data: [], sectionIndex: 1 },
    ]);
  });

  it("returns an empty array for no sections", () => {
    expect(addSectionIndexes([])).toEqual([]);
  });
});

describe("buildHomeSections", () => {
  it("wraps the event sections with the static image sections", () => {
    const eventSections = addSectionIndexes([
      { title: "Today", data: [event("1", "2026-03-10T12:00:00.000Z")] },
    ]);

    expect(buildHomeSections(eventSections)).toEqual([
      { title: "Top Image", data: [] },
      { title: "Saint of the Day", data: [] },
      {
        title: "Today",
        data: [event("1", "2026-03-10T12:00:00.000Z")],
        sectionIndex: 0,
      },
      { title: "Bottom Image", data: [] },
    ]);
  });

  it("still includes the static sections when there are no events", () => {
    expect(buildHomeSections([])).toEqual([
      { title: "Top Image", data: [] },
      { title: "Saint of the Day", data: [] },
      { title: "Bottom Image", data: [] },
    ]);
  });
});
