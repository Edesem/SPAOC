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
