import type { EventData } from "./types";

const base: EventData = {
  id: "abc",
  title: "Youth Night",
  start: "2026-08-13T09:00:00.000Z",
  end: "2026-08-13T11:00:00.000Z",
  allDay: false,
  description: "",
  location: "",
  source: "youth",
};

describe("EventData", () => {
  it("has no `data` field; that key belongs to the SectionList sections", () => {
    // @ts-expect-error `data` is not part of an event
    const withData: EventData = { ...base, data: [] };

    expect(withData.id).toBe("abc");
  });

  it("accepts the parish calendars plus the fasting and saints calendars", () => {
    const sources: EventData["source"][] = [
      "youth",
      "church",
      "fasting",
      "saints",
    ];

    expect(sources).toHaveLength(4);
  });

  it("rejects a source name that is not a known calendar", () => {
    // @ts-expect-error a typo is not a calendar
    const typo: EventData = { ...base, source: "yuoth" };

    expect(typo.source).toBe("yuoth");
  });
});
