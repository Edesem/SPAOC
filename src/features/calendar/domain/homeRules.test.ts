import { EventData } from "../types";
import {
  addSectionIndexes,
  filterSectionsByMonth,
  getLoadErrorMessage,
  getMonthOptions,
  getSaintsTitle,
  GroupedEventSection,
} from "./homeRules";

const event = (id: string, start: string): EventData => ({
  id,
  title: `Event ${id}`,
  start,
  end: start,
  allDay: false,
  description: "",
  location: "",
  source: "church",
});

describe("getSaintsTitle", () => {
  it("uses the singular title for one saint", () => {
    expect(getSaintsTitle(["St. Test"])).toBe("Today we Commemorate");
  });

  it("uses the plural title for multiple saints", () => {
    expect(getSaintsTitle(["St. A", "St. B"])).toBe("Today we Commemorate");
  });

  it("uses the singular title when there are no saints", () => {
    expect(getSaintsTitle([])).toBe("Today we Commemorate");
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
    ).toEqual([
      { title: "Day", data: [event("2", "2026-02-28T13:00:00.000Z")] },
    ]);
    expect(
      filterSectionsByMonth(boundary, new Date("2026-02-15T12:00:00.000Z")),
    ).toEqual([
      { title: "Day", data: [event("1", "2026-02-28T12:59:00.000Z")] },
    ]);
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

describe("getLoadErrorMessage", () => {
  it("returns null when nothing failed", () => {
    expect(
      getLoadErrorMessage({ events: null, saints: null, fast: null }),
    ).toBeNull();
  });

  it("names a single failed source", () => {
    expect(getLoadErrorMessage({ events: "x", saints: null, fast: null })).toBe(
      "Couldn't load events. Pull down to retry.",
    );
  });

  it("joins several failed sources", () => {
    expect(getLoadErrorMessage({ events: "x", saints: "y", fast: "z" })).toBe(
      "Couldn't load events, today's feast and the fast. Pull down to retry.",
    );
  });
});

describe("getMonthOptions", () => {
  const section = (...starts: string[]): GroupedEventSection => ({
    title: "Day",
    data: starts.map((start, index) => event(String(index), start)),
  });

  it("lists each month that has events once, in order", () => {
    const options = getMonthOptions(
      [
        section("2026-11-03T02:00:00.000Z", "2026-11-20T02:00:00.000Z"),
        section("2026-12-05T02:00:00.000Z"),
      ],
      null,
    );

    expect(options.map((option) => option.label)).toEqual([
      "November 2026",
      "December 2026",
    ]);
    expect(options.every((option) => !option.isSelected)).toBe(true);
  });

  it("files an event by the parish month, not the UTC month", () => {
    // 13:30 UTC on 30 Nov is 00:30 on 1 Dec in Melbourne.
    const options = getMonthOptions(
      [section("2026-11-30T13:30:00.000Z")],
      null,
    );

    expect(options.map((option) => option.label)).toEqual(["December 2026"]);
  });

  it("caps the list at the first twelve months", () => {
    const starts = Array.from(
      { length: 15 },
      (_, index) =>
        `${2026 + Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}-15T02:00:00.000Z`,
    );

    const options = getMonthOptions(
      starts.map((start) => section(start)),
      null,
    );

    expect(options).toHaveLength(12);
    expect(options[11].label).toBe("December 2026");
  });

  it("marks the selected month", () => {
    const options = getMonthOptions(
      [section("2026-11-03T02:00:00.000Z", "2026-12-05T02:00:00.000Z")],
      new Date("2026-12-20T02:00:00.000Z"),
    );

    expect(options.map((option) => option.isSelected)).toEqual([false, true]);
  });

  it("keeps a selected month that has no events, in its place", () => {
    const options = getMonthOptions(
      [section("2026-11-03T02:00:00.000Z", "2027-01-05T02:00:00.000Z")],
      new Date("2026-12-10T02:00:00.000Z"),
    );

    expect(options.map((option) => option.label)).toEqual([
      "November 2026",
      "December 2026",
      "January 2027",
    ]);
    expect(options[1].isSelected).toBe(true);
  });

  it("keeps a selected month that falls beyond the cap", () => {
    const starts = Array.from(
      { length: 12 },
      (_, index) =>
        `2026-${String(index + 1).padStart(2, "0")}-15T02:00:00.000Z`,
    );

    const options = getMonthOptions(
      starts.map((start) => section(start)),
      new Date("2027-03-10T02:00:00.000Z"),
    );

    expect(options).toHaveLength(13);
    expect(options[12].label).toBe("March 2027");
    expect(options[12].isSelected).toBe(true);
  });

  it("returns only the selected month when nothing has loaded", () => {
    const options = getMonthOptions([], new Date("2026-11-10T02:00:00.000Z"));

    expect(options.map((option) => option.label)).toEqual(["November 2026"]);
  });

  it("returns nothing when nothing has loaded and no month is selected", () => {
    expect(getMonthOptions([], null)).toEqual([]);
  });

  it("gives each option a date inside its month", () => {
    const [option] = getMonthOptions(
      [section("2026-11-03T02:00:00.000Z")],
      null,
    );

    expect(option.date.toISOString()).toBe("2026-11-03T02:00:00.000Z");
  });
});
