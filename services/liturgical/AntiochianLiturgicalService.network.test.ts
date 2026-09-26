import axios from "axios";
import { Antiochian, type LiturgicalDay } from "@/api/AntiochianApi";
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
    typeOfService: "Divine Liturgy",
  },
  {
    publicUrl: "https://files.antiochian.org/vespers.pdf",
    typeOfService: "Great Vespers",
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
        day: liturgicalDay(ANCHOR_ID + 3),
        texts: serviceTexts,
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

      expect(second.day).toBe(first.day);
      expect(
        getCalls(http).filter((url) => url === `${DAY_URL}${ANCHOR_ID + 1}`),
      ).toHaveLength(1);
      expect(
        getCalls(http).filter((url) => url === `${TEXTS_URL}2026-08-14`),
      ).toHaveLength(2);
    });
  });

  describe("reading and feast transformations", () => {
    it("trims leading whitespace from reading teasers", () => {
      expect(service.getReadingTeasers(liturgicalDay(ANCHOR_ID))).toEqual({
        date: `Day ${ANCHOR_ID}`,
        reading1Title: "Romans 8:28-39",
        reading1Teaser: "All things work together for good.",
        reading2Title: "Matthew 14:22-34",
        reading2Teaser: "Jesus walks on water.",
        reading3Title: "",
        reading3Teaser: "",
      });
    });

    it("keeps trailing whitespace and inner markup", () => {
      const day = liturgicalDay(ANCHOR_ID, {
        reading1Title: "\n\t Romans 8:28-39  ",
        reading1FullText: "  <p>First</p>\n<p>Second</p>  ",
      });

      expect(service.getReadingTeasers(day).reading1Title).toBe(
        "Romans 8:28-39  ",
      );
      expect(service.getReadingTexts(day).reading1FullText).toBe(
        "<p>First</p>\n<p>Second</p>  ",
      );
    });

    it("trims full reading texts and the feast title", () => {
      const day = liturgicalDay(ANCHOR_ID);

      expect(service.getReadingTexts(day)).toEqual({
        reading1FullText: "<p>First reading</p>",
        reading2FullText: "<p>Second reading</p>",
        reading3FullText: "",
      });
      expect(service.getFeastTitle(day)).toEqual({
        feastTitle: `Feast ${ANCHOR_ID}`,
      });
    });

    it("transforms a day fetched through the service", async () => {
      const { day } = await service.getLiturgicalData(
        new Date("2026-08-13T00:00:00Z"),
      );

      expect(service.getFeastTitle(day!)).toEqual({
        feastTitle: `Feast ${ANCHOR_ID}`,
      });
      expect(service.getReadingTeasers(day!).reading2Title).toBe(
        "Matthew 14:22-34",
      );
    });
  });
});
