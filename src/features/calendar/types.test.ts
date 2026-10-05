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
});
