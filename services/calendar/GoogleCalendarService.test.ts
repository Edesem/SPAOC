import { GoogleCalendarService } from "./GoogleCalendarService";
import type { GoogleCalendarEvent } from "./googleCalendarMapper";

const BASE_URL = "https://calendar.test/calendars";

const okResponse = (items?: GoogleCalendarEvent[]) =>
  ({
    ok: true,
    status: 200,
    json: async () => (items === undefined ? {} : { items }),
  }) as Response;

const errorResponse = (status: number) =>
  ({ ok: false, status, json: async () => ({}) }) as Response;

const googleEvent = (
  id: string,
  start: string,
  extra: Partial<GoogleCalendarEvent> = {},
): GoogleCalendarEvent => ({
  id,
  summary: `Event ${id}`,
  start: { dateTime: start },
  end: { dateTime: start },
  ...extra,
});

const requestedUrl = (fetchFn: jest.Mock, call = 0) =>
  new URL(fetchFn.mock.calls[call][0]);

const createService = (fetchFn: jest.Mock) =>
  new GoogleCalendarService(
    {
      apiKey: "test-key",
      baseUrl: BASE_URL,
      parishCalendars: [
        { source: "youth", calendarId: "youth@example.com" },
        { source: "church", calendarId: "church-id" },
      ],
      fastingCalendar: { source: "fasting", calendarId: "fasting-id" },
      saintsCalendar: { source: "saints", calendarId: "saints-id" },
    },
    fetchFn,
  );

describe("GoogleCalendarService", () => {
  let fetchFn: jest.Mock;
  let service: GoogleCalendarService;

  beforeEach(() => {
    fetchFn = jest.fn();
    service = createService(fetchFn);
  });

  describe("getParishEvents", () => {
    const from = new Date("2026-08-13T00:00:00.000Z");

    it("queries every parish calendar for upcoming single events", async () => {
      fetchFn.mockResolvedValue(okResponse([]));

      await service.getParishEvents(from);

      expect(fetchFn).toHaveBeenCalledTimes(2);
      const url = requestedUrl(fetchFn);
      expect(`${url.origin}${url.pathname}`).toBe(
        `${BASE_URL}/youth%40example.com/events`,
      );
      expect(Object.fromEntries(url.searchParams)).toEqual({
        key: "test-key",
        singleEvents: "true",
        timeMin: "2026-08-13T00:00:00.000Z",
        orderBy: "startTime",
      });
      expect(requestedUrl(fetchFn, 1).pathname).toBe(
        "/calendars/church-id/events",
      );
    });

    it("defaults the window start to now", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-09-25T22:15:00Z"));
      fetchFn.mockResolvedValue(okResponse([]));

      await service.getParishEvents();

      expect(requestedUrl(fetchFn).searchParams.get("timeMin")).toBe(
        "2026-09-25T22:15:00.000Z",
      );
      jest.useRealTimers();
    });

    it("sorts across calendars by instant when offsets differ", async () => {
      fetchFn.mockImplementation(async (url: string) =>
        url.includes("youth")
          ? okResponse([googleEvent("y1", "2026-08-14T08:00:00-05:00")])
          : okResponse([googleEvent("c1", "2026-08-14T20:00:00+10:00")]),
      );

      const events = await service.getParishEvents(from);

      expect(events.map(({ id, start }) => ({ id, start }))).toEqual([
        { id: "c1", start: "2026-08-14T10:00:00.000Z" },
        { id: "y1", start: "2026-08-14T13:00:00.000Z" },
      ]);
    });

    it("merges calendars, tags sources, and sorts by start", async () => {
      fetchFn.mockImplementation(async (url: string) =>
        url.includes("youth")
          ? okResponse([googleEvent("y1", "2026-08-15T10:00:00Z")])
          : okResponse([googleEvent("c1", "2026-08-14T10:00:00Z")]),
      );

      const events = await service.getParishEvents(from);

      expect(events.map(({ id, source }) => ({ id, source }))).toEqual([
        { id: "c1", source: "church" },
        { id: "y1", source: "youth" },
      ]);
    });

    it("drops private events", async () => {
      fetchFn.mockResolvedValue(
        okResponse([
          googleEvent("public", "2026-08-14T10:00:00Z"),
          googleEvent("hidden", "2026-08-14T11:00:00Z", {
            visibility: "private",
          }),
        ]),
      );

      const events = await service.getParishEvents(from);

      expect(events.map((e) => e.id)).toEqual(["public", "public"]);
    });

    it("skips a calendar that fails and keeps the others", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      fetchFn.mockImplementation(async (url: string) =>
        url.includes("youth")
          ? errorResponse(500)
          : okResponse([googleEvent("c1", "2026-08-14T10:00:00Z")]),
      );

      const events = await service.getParishEvents(from);

      expect(events.map((e) => e.id)).toEqual(["c1"]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching youth:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it("treats a response without items as empty", async () => {
      fetchFn.mockResolvedValue(okResponse(undefined));

      await expect(service.getParishEvents(from)).resolves.toEqual([]);
    });
  });

  describe("getFastingEvents", () => {
    it("returns normalized fasting calendar entries", async () => {
      fetchFn.mockResolvedValue(
        okResponse([
          {
            id: "f1",
            summary: "Strict Fast",
            start: { date: "2026-08-13" },
            end: { date: "2026-08-14" },
          },
        ]),
      );

      const events = await service.getFastingEvents(
        new Date("2026-08-13T00:00:00.000Z"),
      );

      expect(requestedUrl(fetchFn).pathname).toBe(
        "/calendars/fasting-id/events",
      );
      expect(events).toEqual([
        expect.objectContaining({
          id: "f1",
          title: "Strict Fast",
          start: "2026-08-13T00:00:00.000Z",
          end: "2026-08-14",
          source: "fasting",
        }),
      ]);
    });

    it("propagates provider errors", async () => {
      fetchFn.mockResolvedValue(errorResponse(403));

      await expect(service.getFastingEvents()).rejects.toThrow(
        "HTTP error! Status: 403",
      );
    });
  });

  describe("malformed responses", () => {
    const from = new Date("2026-08-13T00:00:00.000Z");
    let consoleErrorSpy: jest.SpyInstance;

    const jsonResponse = (body: unknown) =>
      ({ ok: true, status: 200, json: async () => body }) as Response;

    const unparseableResponse = () =>
      ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON");
        },
      }) as unknown as Response;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("treats null items as empty", async () => {
      fetchFn.mockResolvedValue(jsonResponse({ items: null }));

      await expect(service.getParishEvents(from)).resolves.toEqual([]);
      await expect(service.getFastingEvents(from)).resolves.toEqual([]);
      await expect(service.getSaintsForDate(from)).resolves.toEqual([]);
    });

    it("skips a parish calendar whose body is not JSON", async () => {
      fetchFn.mockImplementation(async (url: string) =>
        url.includes("youth")
          ? unparseableResponse()
          : okResponse([googleEvent("c1", "2026-08-14T10:00:00Z")]),
      );

      const events = await service.getParishEvents(from);

      expect(events.map((e) => e.id)).toEqual(["c1"]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching youth:",
        expect.any(SyntaxError),
      );
    });

    it("skips a parish calendar containing an event without a start", async () => {
      fetchFn.mockImplementation(async (url: string) =>
        url.includes("youth")
          ? jsonResponse({
              items: [
                googleEvent("y1", "2026-08-15T10:00:00Z"),
                { id: "broken", summary: "No start" },
              ],
            })
          : okResponse([googleEvent("c1", "2026-08-14T10:00:00Z")]),
      );

      const events = await service.getParishEvents(from);

      // One bad item drops the whole calendar rather than just that event
      expect(events.map((e) => e.id)).toEqual(["c1"]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching youth:",
        expect.any(TypeError),
      );
    });

    it("skips a parish calendar containing an unparseable date", async () => {
      fetchFn.mockImplementation(async (url: string) =>
        url.includes("youth")
          ? okResponse([googleEvent("y1", "not-a-date")])
          : okResponse([googleEvent("c1", "2026-08-14T10:00:00Z")]),
      );

      const events = await service.getParishEvents(from);

      expect(events.map((e) => e.id)).toEqual(["c1"]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching youth:",
        expect.any(RangeError),
      );
    });

    it("rejects fasting events when the body is not JSON", async () => {
      fetchFn.mockResolvedValue(unparseableResponse());

      await expect(service.getFastingEvents(from)).rejects.toThrow(SyntaxError);
    });

    it("rejects fasting events containing an unparseable date", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ items: [{ id: "f1", start: {} }] }),
      );

      await expect(service.getFastingEvents(from)).rejects.toThrow(RangeError);
    });

    it("returns no saints when the body is not JSON", async () => {
      fetchFn.mockResolvedValue(unparseableResponse());

      await expect(service.getSaintsForDate(from)).resolves.toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("tolerates saint entries missing fields other than summary", async () => {
      fetchFn.mockResolvedValue(
        jsonResponse({ items: [{ id: "s1", summary: "St Paul" }] }),
      );

      await expect(service.getSaintsForDate(from)).resolves.toEqual([
        "St Paul",
      ]);
    });
  });

  describe("getSaintsForDate", () => {
    it("queries the whole local day without mutating the date", async () => {
      fetchFn.mockResolvedValue(okResponse([]));
      const date = new Date(2026, 7, 13, 15, 30);
      const original = date.getTime();

      await service.getSaintsForDate(date);

      const params = requestedUrl(fetchFn).searchParams;
      expect(params.get("timeMin")).toBe(
        new Date(2026, 7, 13, 0, 0, 0, 0).toISOString(),
      );
      expect(params.get("timeMax")).toBe(
        new Date(2026, 7, 13, 23, 59, 59, 999).toISOString(),
      );
      expect(date.getTime()).toBe(original);
    });

    it("returns saint names with a fallback for untitled entries", async () => {
      fetchFn.mockResolvedValue(
        okResponse([
          googleEvent("s1", "2026-08-13T00:00:00Z", { summary: "St Paul" }),
          googleEvent("s2", "2026-08-13T00:00:00Z", { summary: undefined }),
        ]),
      );

      await expect(service.getSaintsForDate(new Date())).resolves.toEqual([
        "St Paul",
        "Unnamed Saint",
      ]);
    });

    it("returns an empty list when the request fails", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      fetchFn.mockRejectedValue(new Error("Network error"));

      await expect(service.getSaintsForDate(new Date())).resolves.toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});

describe("GoogleCalendarService with the global fetch", () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: jest.Mock;

  // Shape of a real events.list response, including fields the app ignores
  const eventsListResponse = {
    kind: "calendar#events",
    etag: '"p33c9vvnrlso8o0o"',
    summary: "St Paul Fasting",
    timeZone: "Australia/Melbourne",
    updated: "2026-08-01T02:13:45.123Z",
    accessRole: "reader",
    nextSyncToken: "CPDAlvWDx70CEPDAlvWDx70CGAU=",
    items: [
      {
        kind: "calendar#event",
        etag: '"3181161784712000"',
        id: "7q2m1v0g6c9s",
        status: "confirmed",
        htmlLink: "https://www.google.com/calendar/event?eid=abc",
        created: "2026-07-01T00:00:00.000Z",
        updated: "2026-07-02T00:00:00.000Z",
        summary: "Dormition Fast",
        description: "Fast from <i>meat</i> and dairy",
        creator: { email: "office@example.com" },
        organizer: { email: "fasting-id", self: true },
        start: { date: "2026-08-01" },
        end: { date: "2026-08-15" },
        transparency: "transparent",
        iCalUID: "7q2m1v0g6c9s@google.com",
        sequence: 0,
        eventType: "default",
      },
      {
        kind: "calendar#event",
        id: "a1b2c3",
        status: "confirmed",
        summary: "Paraklesis",
        location: "St Paul's Church",
        start: {
          dateTime: "2026-08-03T19:00:00+10:00",
          timeZone: "Australia/Melbourne",
        },
        end: {
          dateTime: "2026-08-03T20:00:00+10:00",
          timeZone: "Australia/Melbourne",
        },
      },
    ],
  };

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => eventsListResponse,
    });
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("requests through fetch and normalizes a full provider payload", async () => {
    const service = new GoogleCalendarService({
      apiKey: "test-key",
      fastingCalendar: { source: "fasting", calendarId: "fasting-id" },
    });

    const events = await service.getFastingEvents(
      new Date("2026-08-01T00:00:00.000Z"),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://www.googleapis.com/calendar/v3/calendars/fasting-id/events" +
        "?key=test-key&singleEvents=true" +
        "&timeMin=2026-08-01T00%3A00%3A00.000Z&orderBy=startTime",
    );
    expect(events).toEqual([
      {
        id: "7q2m1v0g6c9s",
        title: "Dormition Fast",
        start: "2026-08-01T00:00:00.000Z",
        end: "2026-08-15",
        description: "Fast from <i>meat</i> and dairy",
        location: undefined,
        source: "fasting",
        data: [],
      },
      {
        id: "a1b2c3",
        title: "Paraklesis",
        start: "2026-08-03T09:00:00.000Z",
        end: "2026-08-03T20:00:00+10:00",
        description: undefined,
        location: "St Paul's Church",
        source: "fasting",
        data: [],
      },
    ]);
  });

  it("rejects when the network request itself fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    const service = new GoogleCalendarService({ apiKey: "test-key" });

    await expect(service.getFastingEvents()).rejects.toThrow(
      "Network request failed",
    );
  });
});
