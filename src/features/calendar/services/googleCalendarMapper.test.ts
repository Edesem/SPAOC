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
      allDay: false,
      description: "<b>Pizza</b>",
      location: "Church Hall",
      source: "youth",
    });
  });

  it("maps an all-day event to the parish day boundaries", () => {
    const event = normalizeGoogleEvent(
      {
        id: "fast",
        summary: "Strict Fast",
        start: { date: "2026-08-13" },
        end: { date: "2026-08-14" },
      },
      "fasting",
    );

    expect(event.allDay).toBe(true);
    expect(event.start).toBe("2026-08-12T14:00:00.000Z");
    expect(event.end).toBe("2026-08-13T14:00:00.000Z");
  });

  it("uses the daylight saving offset for all-day events in summer", () => {
    const event = normalizeGoogleEvent(
      {
        id: "summer",
        start: { date: "2026-12-01" },
        end: { date: "2026-12-02" },
      },
      "church",
    );

    expect(event.start).toBe("2026-11-30T13:00:00.000Z");
    expect(event.end).toBe("2026-12-01T13:00:00.000Z");
  });

  it("keeps an all-day event's end empty when the provider omits it", () => {
    const event = normalizeGoogleEvent(
      { id: "x", start: { date: "2026-08-13" } },
      "church",
    );

    expect(event.allDay).toBe(true);
    expect(event.end).toBe("");
  });

  it("does not flag a timed event as all-day", () => {
    expect(normalizeGoogleEvent(timedEvent, "youth").allDay).toBe(false);
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
    expect(isPrivateEvent({ ...timedEvent, visibility: "private" })).toBe(true);
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

describe("date normalization", () => {
  const withStart = (start: GoogleCalendarEvent["start"]) =>
    normalizeGoogleEvent({ id: "d", start }, "church").start;

  it.each([
    ["UTC", "2026-08-13T09:00:00Z"],
    ["a positive offset", "2026-08-13T19:00:00+10:00"],
    ["a negative offset", "2026-08-13T05:00:00-04:00"],
    ["fractional seconds", "2026-08-13T09:00:00.000Z"],
  ])("normalizes a dateTime with %s to a UTC ISO string", (_, dateTime) => {
    expect(withStart({ dateTime })).toBe("2026-08-13T09:00:00.000Z");
  });

  it("anchors an all-day date at parish midnight regardless of device zone", () => {
    expect(withStart({ date: "2026-12-31" })).toBe("2026-12-30T13:00:00.000Z");
  });

  it("prefers dateTime over date when both are present", () => {
    expect(
      withStart({ date: "2026-08-20", dateTime: "2026-08-13T09:00:00Z" }),
    ).toBe("2026-08-13T09:00:00.000Z");
  });

  it("keeps the provider's end value, offset included", () => {
    const event = normalizeGoogleEvent(
      {
        id: "d",
        start: { dateTime: "2026-08-13T19:00:00+10:00" },
        end: { dateTime: "2026-08-13T21:00:00+10:00" },
      },
      "church",
    );

    expect(event.end).toBe("2026-08-13T21:00:00+10:00");
  });

  it("prefers the end dateTime over the end date", () => {
    const event = normalizeGoogleEvent(
      {
        id: "d",
        start: { dateTime: "2026-08-13T19:00:00+10:00" },
        end: { date: "2026-08-14", dateTime: "2026-08-13T21:00:00Z" },
      },
      "church",
    );

    expect(event.end).toBe("2026-08-13T21:00:00Z");
  });

  it.each([
    ["an empty start", {}],
    ["an unparseable dateTime", { dateTime: "13/08/2026 7pm" }],
    ["an unparseable date", { date: "2026-02-30x" }],
  ])("throws a RangeError for %s", (_, start) => {
    expect(() => withStart(start)).toThrow(RangeError);
  });
});

describe("byStartTime with mixed event kinds", () => {
  it("sorts an all-day event before a morning event on the same parish day", () => {
    const allDay = normalizeGoogleEvent(
      { id: "all-day", start: { date: "2026-08-13" } },
      "church",
    );
    const morning = normalizeGoogleEvent(
      { id: "morning", start: { dateTime: "2026-08-13T09:00:00+10:00" } },
      "church",
    );
    const evening = normalizeGoogleEvent(
      { id: "evening", start: { dateTime: "2026-08-13T19:00:00+10:00" } },
      "church",
    );

    expect(
      [evening, morning, allDay].sort(byStartTime).map((e) => e.id),
    ).toEqual(["all-day", "morning", "evening"]);
  });
});
