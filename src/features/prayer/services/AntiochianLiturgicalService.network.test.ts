import axios from "axios";
import { Antiochian, type LiturgicalDay } from "./AntiochianApi";
import { AntiochianLiturgicalService } from "./AntiochianLiturgicalService";

// Only the HTTP layer is mocked: the real Antiochian client runs underneath
// the service, so auth, ID derivation and caching are all exercised.
jest.mock("axios", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

const API = "https://antiochian.org/";
const DAY_URL = `${API}api/antiochian/LiturgicalDay/`;
const TEXTS_URL = `${API}api/antiochian/LiturgicalTexts/`;

const ANCHOR_ID = 12_345;
const ANCHOR_DATE = "2026-08-13T00:00:00.000Z";

type FakeHttp = {
  get: jest.Mock;
  post: jest.Mock;
  defaults: { headers: Record<string, string> };
};

type HttpResponse = { status: number; data: unknown };

const ok = (data: unknown): HttpResponse => ({ status: 200, data });

const liturgicalDay = (
  itemId: number,
  extra: Partial<LiturgicalDay> = {},
): LiturgicalDay => ({
  originalCalendarDate: ANCHOR_DATE,
  itemId,
  calendarDateLong: `Day ${itemId}`,
  fastDesignation: "Fast Day",
  feastDayTitle: `  Feast ${itemId}`,
  reading1Title: "  Romans 8:28-39",
  reading1Teaser: "  All things work together for good.",
  reading2Title: "  Matthew 14:22-34",
  reading2Teaser: "  Jesus walks on water.",
  reading3Title: "",
  reading3Teaser: "",
  reading1FullText: "  <p>First reading</p>",
  reading2FullText: "  <p>Second reading</p>",
  reading3FullText: "",
  ...extra,
});

const serviceTexts = [
  {
    publicUrl: "https://files.antiochian.org/liturgy.pdf",
    typeOfService: "Divine Liturgy (PDF)",
  },
  {
    publicUrl: "https://files.antiochian.org/vespers.pdf",
    typeOfService: "Great Vespers (PDF)",
  },
];

// What the app sees for `liturgicalDay(id)` and `serviceTexts`
const mappedDay = (id: number) => ({
  feastTitle: `Feast ${id}`,
  readings: [
    {
      kind: "epistle",
      title: "Romans 8:28-39",
      teaser: "All things work together for good.",
      fullText: "<p>First reading</p>",
    },
    {
      kind: "gospel",
      title: "Matthew 14:22-34",
      teaser: "Jesus walks on water.",
      fullText: "<p>Second reading</p>",
    },
  ],
});

const mappedServices = [
  {
    title: "Divine Liturgy",
    pdfUrl: "https://files.antiochian.org/liturgy.pdf",
  },
  {
    title: "Great Vespers",
    pdfUrl: "https://files.antiochian.org/vespers.pdf",
  },
];

const tokenResponse = ok({
  access_token: "token-abc",
  expires_in: 3600,
  token_type: "Bearer",
});

// Route GETs by URL: day 0 is the anchor the client uses to map dates to IDs
const defaultGet = async (url: string): Promise<HttpResponse> => {
  if (url.startsWith(DAY_URL)) {
    const id = Number(url.slice(DAY_URL.length));
    return ok({ liturgicalDay: liturgicalDay(id === 0 ? ANCHOR_ID : id) });
  }
  if (url.startsWith(TEXTS_URL)) return ok(serviceTexts);
  throw new Error(`Unexpected GET ${url}`);
};

// A provider day with fields dropped, as a malformed payload would arrive
const dayWithout = (...fields: string[]): LiturgicalDay => {
  const day: Record<string, unknown> = { ...liturgicalDay(ANCHOR_ID) };
  fields.forEach((field) => delete day[field]);
  return day as LiturgicalDay;
};

const getCalls = (http: FakeHttp) =>
  http.get.mock.calls.map(([url]: [string]) => url);

describe("AntiochianLiturgicalService over the network", () => {
  let http: FakeHttp;
  let service: AntiochianLiturgicalService;

  beforeEach(() => {
    http = {
      get: jest.fn(defaultGet),
      post: jest.fn().mockResolvedValue(tokenResponse),
      defaults: { headers: {} },
    };
    (axios.create as jest.Mock).mockReturnValue(http);
    service = new AntiochianLiturgicalService(new Antiochian());
  });

  describe("successful responses", () => {
    it("authenticates with client credentials and sends the bearer token", async () => {
      await service.getLiturgicalData(new Date("2026-08-13T00:00:00Z"));

      expect(axios.create).toHaveBeenCalledWith({
        headers: { Host: "www.antiochian.org" },
      });
      expect(http.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = http.post.mock.calls[0];
      expect(url).toBe(`${API}connect/token`);
      expect(Object.fromEntries(new URLSearchParams(body))).toEqual({
        client_id: "antiochian_api",
        client_secret: expect.any(String),
        grant_type: "client_credentials",
      });
      expect(config).toEqual({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      expect(http.defaults.headers.Authorization).toBe("Bearer token-abc");
    });

    it("anchors on today's day, then fetches the requested day and texts", async () => {
      const result = await service.getLiturgicalData(
        new Date("2026-08-16T00:00:00Z"),
      );

      expect(getCalls(http)).toEqual([
        `${DAY_URL}0`,
        `${DAY_URL}${ANCHOR_ID + 3}`,
        `${TEXTS_URL}2026-08-16`,
      ]);
      expect(result).toEqual({
        day: mappedDay(ANCHOR_ID + 3),
        services: mappedServices,
      });
    });

    it("authenticates only once across requests", async () => {
      await service.getLiturgicalData(new Date("2026-08-14T00:00:00Z"));
      await service.getLiturgicalData(new Date("2026-08-15T00:00:00Z"));

      expect(http.post).toHaveBeenCalledTimes(1);
      expect(
        getCalls(http).filter((url) => url === `${DAY_URL}0`),
      ).toHaveLength(1);
    });

    it("serves a repeated day from cache but refetches its texts", async () => {
      const date = new Date("2026-08-14T00:00:00Z");

      const first = await service.getLiturgicalData(date);
      const second = await service.getLiturgicalData(date);

      expect(second).toEqual(first);
      expect(
        getCalls(http).filter((url) => url === `${DAY_URL}${ANCHOR_ID + 1}`),
      ).toHaveLength(1);
      expect(
        getCalls(http).filter((url) => url === `${TEXTS_URL}2026-08-14`),
      ).toHaveLength(2);
    });
  });

  describe("mapping into the app's shape", () => {
    const date = new Date("2026-08-14T00:00:00Z");

    // Serve the given provider day for `date`
    const serveDay = (day: LiturgicalDay): void => {
      http.get.mockImplementation(async (url: string) =>
        url === `${DAY_URL}${ANCHOR_ID + 1}`
          ? ok({ liturgicalDay: day })
          : defaultGet(url),
      );
    };

    const mapDay = async (day: LiturgicalDay) => {
      serveDay(day);
      return (await service.getLiturgicalData(date)).day!;
    };

    it("trims leading whitespace from readings and the feast title", async () => {
      await expect(mapDay(liturgicalDay(ANCHOR_ID + 1))).resolves.toEqual(
        mappedDay(ANCHOR_ID + 1),
      );
    });

    it("keeps trailing whitespace and inner markup", async () => {
      const day = await mapDay(
        liturgicalDay(ANCHOR_ID, {
          reading1Title: "\n\t Romans 8:28-39  ",
          reading1FullText: "  <p>First</p>\n<p>Second</p>  ",
        }),
      );

      expect(day.readings[0].title).toBe("Romans 8:28-39  ");
      expect(day.readings[0].fullText).toBe("<p>First</p>\n<p>Second</p>  ");
    });

    it("includes a third reading when the provider has one", async () => {
      const day = await mapDay(
        liturgicalDay(ANCHOR_ID, {
          reading3Title: "  Acts 1:1-8",
          reading3Teaser: "  A third teaser.",
          reading3FullText: "  <p>Third reading</p>",
        }),
      );

      expect(day.readings.map((reading) => reading.kind)).toEqual([
        "epistle",
        "gospel",
        "thirdReading",
      ]);
      expect(day.readings[2]).toEqual({
        kind: "thirdReading",
        title: "Acts 1:1-8",
        teaser: "A third teaser.",
        fullText: "<p>Third reading</p>",
      });
    });

    it("leaves out a third reading the provider omits (#64)", async () => {
      const day = await mapDay(
        dayWithout("reading3Title", "reading3Teaser", "reading3FullText"),
      );

      expect(day.readings.map((reading) => reading.kind)).toEqual([
        "epistle",
        "gospel",
      ]);
    });

    it("has no feast title when the provider omits it (#62)", async () => {
      const day = await mapDay(dayWithout("feastDayTitle"));

      expect(day.feastTitle).toBeNull();
    });

    it("leaves out a reading whose title is missing instead of throwing (#64)", async () => {
      const day = await mapDay(dayWithout("reading2Title"));

      expect(day.readings.map((reading) => reading.kind)).toEqual(["epistle"]);
    });

    it("leaves out a reading whose full text is missing", async () => {
      const day = await mapDay(dayWithout("reading1FullText"));

      expect(day.readings.map((reading) => reading.kind)).toEqual(["gospel"]);
    });

    it("keeps only the PDF services, titled without the suffix", async () => {
      withServices([
        { publicUrl: "https://files/a.pdf", typeOfService: "Matins (PDF)" },
        { publicUrl: "https://files/b.mp3", typeOfService: "Matins Audio" },
      ]);

      const { services } = await service.getLiturgicalData(date);

      expect(services).toEqual([
        { title: "Matins", pdfUrl: "https://files/a.pdf" },
      ]);
    });

    const withServices = (texts: unknown): void => {
      http.get.mockImplementation(async (url: string) =>
        url.startsWith(TEXTS_URL) ? ok(texts) : defaultGet(url),
      );
    };
  });

  describe("malformed and empty responses", () => {
    const date = new Date("2026-08-14T00:00:00Z");

    const withGet = (
      override: (url: string) => HttpResponse | undefined,
    ): void => {
      http.get.mockImplementation(
        async (url: string) => override(url) ?? defaultGet(url),
      );
    };

    it("returns null day and services for non-200 responses", async () => {
      withGet((url) =>
        url === `${DAY_URL}0` ? undefined : { status: 204, data: "" },
      );

      await expect(service.getLiturgicalData(date)).resolves.toEqual({
        day: null,
        services: null,
      });
    });

    it("returns an empty service list when none are published", async () => {
      withGet((url) => (url.startsWith(TEXTS_URL) ? ok([]) : undefined));

      const { services } = await service.getLiturgicalData(date);

      expect(services).toEqual([]);
    });

    it("returns null services for an empty body", async () => {
      withGet((url) => (url.startsWith(TEXTS_URL) ? ok(null) : undefined));

      const { services } = await service.getLiturgicalData(date);

      expect(services).toBeNull();
    });

    it("returns a null day when the body lacks liturgicalDay", async () => {
      withGet((url) =>
        url === `${DAY_URL}${ANCHOR_ID + 1}` ? ok({}) : undefined,
      );

      const { day } = await service.getLiturgicalData(date);

      expect(day).toBeNull();
    });

    it("does not cache a missing day, so the next request retries", async () => {
      withGet((url) =>
        url === `${DAY_URL}${ANCHOR_ID + 1}` ? ok({}) : undefined,
      );
      await service.getLiturgicalData(date);

      http.get.mockImplementation(defaultGet);
      const { day } = await service.getLiturgicalData(date);

      expect(day).toEqual(mappedDay(ANCHOR_ID + 1));
    });

    it("rejects without fetching data when the token request fails", async () => {
      http.post.mockRejectedValue(new Error("Request failed with status 401"));

      await expect(service.getLiturgicalData(date)).rejects.toThrow(
        "Request failed with status 401",
      );
      expect(http.get).not.toHaveBeenCalled();
    });

    it("rejects when the anchor response lacks liturgicalDay, then re-authenticates", async () => {
      withGet((url) => (url === `${DAY_URL}0` ? ok({}) : undefined));

      await expect(service.getLiturgicalData(date)).rejects.toThrow(TypeError);

      http.get.mockImplementation(defaultGet);
      await expect(service.getLiturgicalData(date)).resolves.toEqual({
        day: mappedDay(ANCHOR_ID + 1),
        services: mappedServices,
      });
      expect(http.post).toHaveBeenCalledTimes(2);
    });

    it("sends an undefined bearer token when the token body is empty", async () => {
      http.post.mockResolvedValue(ok({}));

      await service.getLiturgicalData(date);

      expect(http.defaults.headers.Authorization).toBe("Bearer undefined");
    });

    it("rejects when a data request fails", async () => {
      withGet((url) => {
        if (url.startsWith(TEXTS_URL)) {
          throw new Error("Request failed with status 500");
        }
        return undefined;
      });

      await expect(service.getLiturgicalData(date)).rejects.toThrow(
        "Request failed with status 500",
      );
    });
  });

  describe("date parsing and normalization", () => {
    // Day and texts URLs requested for a date, ignoring the anchor lookup
    const requestsFor = async (date?: Date) => {
      await service.getLiturgicalData(date);
      return getCalls(http).filter((url) => url !== `${DAY_URL}0`);
    };

    it.each([
      ["the anchor day", "2026-08-13", ANCHOR_ID],
      ["the next day", "2026-08-14", ANCHOR_ID + 1],
      ["a later month", "2026-09-01", ANCHOR_ID + 19],
      ["the next year", "2027-01-01", ANCHOR_ID + 141],
      ["an earlier day", "2026-08-01", ANCHOR_ID - 12],
    ])("maps %s to its day ID and text date", async (_, isoDate, id) => {
      await expect(
        requestsFor(new Date(`${isoDate}T00:00:00Z`)),
      ).resolves.toEqual([`${DAY_URL}${id}`, `${TEXTS_URL}${isoDate}`]);
    });

    it("ignores the time of day within a parish day", async () => {
      await expect(
        requestsFor(new Date("2026-08-16T23:59:59.999+10:00")),
      ).resolves.toEqual([
        `${DAY_URL}${ANCHOR_ID + 3}`,
        `${TEXTS_URL}2026-08-16`,
      ]);
    });

    it("keys requests by the parish day, not the UTC day (#59)", async () => {
      // 8am on the 16th in Melbourne is still the 15th in UTC
      await expect(
        requestsFor(new Date("2026-08-16T08:00:00+10:00")),
      ).resolves.toEqual([
        `${DAY_URL}${ANCHOR_ID + 3}`,
        `${TEXTS_URL}2026-08-16`,
      ]);
    });

    it.each([
      [
        "just after midnight, standard time",
        "2026-08-16T00:00:00+10:00",
        3,
        "2026-08-16",
      ],
      [
        "just before midnight, standard time",
        "2026-08-15T23:59:59+10:00",
        2,
        "2026-08-15",
      ],
      [
        "just after midnight, daylight saving",
        "2026-12-01T00:30:00+11:00",
        110,
        "2026-12-01",
      ],
      [
        "just before midnight, daylight saving",
        "2026-11-30T23:59:59+11:00",
        109,
        "2026-11-30",
      ],
    ])(
      "requests the local day for %s (#59)",
      async (_, instant, daysFromAnchor, textsDate) => {
        await expect(requestsFor(new Date(instant))).resolves.toEqual([
          `${DAY_URL}${ANCHOR_ID + daysFromAnchor}`,
          `${TEXTS_URL}${textsDate}`,
        ]);
      },
    );

    it("counts a day across a daylight saving change as one", async () => {
      await expect(
        requestsFor(new Date("2026-10-04T12:00:00+11:00")),
      ).resolves.toEqual([
        `${DAY_URL}${ANCHOR_ID + 52}`,
        `${TEXTS_URL}2026-10-04`,
      ]);
    });

    it("anchors IDs on the anchor day's originalCalendarDate", async () => {
      http.get.mockImplementation(async (url: string) =>
        url === `${DAY_URL}0`
          ? ok({
              liturgicalDay: liturgicalDay(500, {
                originalCalendarDate: "2026-09-01T00:00:00.000Z",
              }),
            })
          : defaultGet(url),
      );

      await expect(
        requestsFor(new Date("2026-09-03T00:00:00Z")),
      ).resolves.toEqual([`${DAY_URL}502`, `${TEXTS_URL}2026-09-03`]);
    });

    it("shares one cached day between times on the same parish day", async () => {
      await service.getLiturgicalData(new Date("2026-08-14T00:30:00+10:00"));
      await service.getLiturgicalData(new Date("2026-08-14T23:30:00+10:00"));

      expect(
        getCalls(http).filter((url) => url === `${DAY_URL}${ANCHOR_ID + 1}`),
      ).toHaveLength(1);
    });

    it("defaults to the current instant", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-09-25T22:15:00Z"));

      // 8:15am on the 26th in Melbourne
      await expect(requestsFor()).resolves.toEqual([
        `${DAY_URL}${ANCHOR_ID + 44}`,
        `${TEXTS_URL}2026-09-26`,
      ]);
      jest.useRealTimers();
    });
  });
});
