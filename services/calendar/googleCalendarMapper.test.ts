import {
  byStartTime,
  isPrivateEvent,
  normalizeGoogleEvent,
  type GoogleCalendarEvent,
} from "./googleCalendarMapper";

const timedEvent: GoogleCalendarEvent = {
  id: "abc",
  summary: "Youth Night",
  description: "<b>Pizza</b>",
  location: "Church Hall",
  start: { dateTime: "2026-08-13T19:00:00+10:00" },
  end: { dateTime: "2026-08-13T21:00:00+10:00" },
};

describe("normalizeGoogleEvent", () => {
  it("maps a timed event into the app event shape", () => {
    expect(normalizeGoogleEvent(timedEvent, "youth")).toEqual({
      id: "abc",
      title: "Youth Night",
      start: "2026-08-13T09:00:00.000Z",
      end: "2026-08-13T21:00:00+10:00",
      description: "<b>Pizza</b>",
      location: "Church Hall",
      source: "youth",
      data: [],
    });
  });

  it("parses all-day events from their date", () => {
    const event = normalizeGoogleEvent(
      {
        id: "fast",
        summary: "Strict Fast",
        start: { date: "2026-08-13" },
        end: { date: "2026-08-14" },
      },
      "fasting",
    );

    expect(event.start).toBe("2026-08-13T00:00:00.000Z");
    expect(event.end).toBe("2026-08-14");
  });

  it("falls back to a default title", () => {
    expect(
      normalizeGoogleEvent({ ...timedEvent, summary: "" }, "youth").title,
    ).toBe("No Title");
    expect(
      normalizeGoogleEvent({ ...timedEvent, summary: undefined }, "youth")
        .title,
    ).toBe("No Title");
  });

  it("uses an empty end when the provider omits it", () => {
    expect(
      normalizeGoogleEvent({ ...timedEvent, end: undefined }, "youth").end,
    ).toBe("");
  });

  it("leaves missing description and location undefined", () => {
    const event = normalizeGoogleEvent(
      { id: "x", start: { date: "2026-08-13" } },
      "church",
    );

    expect(event.description).toBeUndefined();
    expect(event.location).toBeUndefined();
  });
});

describe("isPrivateEvent", () => {
  it("is true only for private visibility", () => {
    expect(isPrivateEvent({ ...timedEvent, visibility: "private" })).toBe(
      true,
    );
    expect(isPrivateEvent({ ...timedEvent, visibility: "public" })).toBe(false);
    expect(isPrivateEvent(timedEvent)).toBe(false);
  });
});

describe("byStartTime", () => {
  it("orders events by start timestamp", () => {
    const later = normalizeGoogleEvent(
      { id: "2", start: { dateTime: "2026-08-14T00:00:00Z" } },
      "church",
    );
    const earlier = normalizeGoogleEvent(
      { id: "1", start: { dateTime: "2026-08-13T00:00:00Z" } },
      "church",
    );

    expect([later, earlier].sort(byStartTime).map((e) => e.id)).toEqual([
      "1",
      "2",
    ]);
  });
});
