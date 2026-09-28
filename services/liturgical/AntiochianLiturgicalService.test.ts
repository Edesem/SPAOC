import {
  AntiochianLiturgicalService,
  type AntiochianClient,
} from "./AntiochianLiturgicalService";

const liturgicalDay = {
  originalCalendarDate: "2026-08-13T00:00:00.000Z",
  itemId: 12_345,
  calendarDateLong: "Thursday, 13 August 2026",
  fastDesignation: "",
  feastDayTitle: "Dormition Fast",
  reading1Title: "Romans 8:28-39",
  reading1Teaser: "All things work together for good.",
  reading2Title: "Matthew 14:22-34",
  reading2Teaser: "Jesus walks on water.",
  reading3Title: "",
  reading3Teaser: "",
  reading1FullText: "First reading",
  reading2FullText: "Second reading",
  reading3FullText: "",
};

const texts = [
  { publicUrl: "https://example.com", typeOfService: "Divine Liturgy PDF" },
];

const createClient = (): jest.Mocked<AntiochianClient> => ({
  ensureAuthenticated: jest.fn().mockResolvedValue(undefined),
  getLiturgicalDay: jest.fn().mockResolvedValue(liturgicalDay),
  getLiturgicalText: jest.fn().mockResolvedValue(texts),
  getReadingTeasers: jest.fn().mockReturnValue({ date: "teasers" }),
  getReadingTexts: jest.fn().mockReturnValue({ reading1FullText: "text" }),
  getFeastTitle: jest.fn().mockReturnValue({ feastTitle: "feast" }),
});

describe("AntiochianLiturgicalService", () => {
  let client: jest.Mocked<AntiochianClient>;
  let service: AntiochianLiturgicalService;

  beforeEach(() => {
    client = createClient();
    service = new AntiochianLiturgicalService(client);
  });

  describe("getLiturgicalData", () => {
    it("authenticates before fetching the day and texts", async () => {
      const date = new Date("2026-08-13T00:00:00.000Z");

      await expect(service.getLiturgicalData(date)).resolves.toEqual({
        day: liturgicalDay,
        texts,
      });

      expect(client.ensureAuthenticated).toHaveBeenCalledTimes(1);
      expect(client.getLiturgicalDay).toHaveBeenCalledWith(date);
      expect(client.getLiturgicalText).toHaveBeenCalledWith(date);
      expect(
        client.ensureAuthenticated.mock.invocationCallOrder[0],
      ).toBeLessThan(client.getLiturgicalDay.mock.invocationCallOrder[0]);
    });

    it("defaults to today when no date is given", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-09-25T09:00:00Z"));

      await service.getLiturgicalData();

      expect(client.getLiturgicalDay).toHaveBeenCalledWith(
        new Date("2026-09-25T09:00:00Z"),
      );
      jest.useRealTimers();
    });

    it("passes through null results from the provider", async () => {
      client.getLiturgicalDay.mockResolvedValue(null);
      client.getLiturgicalText.mockResolvedValue(null);

      await expect(service.getLiturgicalData()).resolves.toEqual({
        day: null,
        texts: null,
      });
    });

    it("propagates provider errors", async () => {
      client.ensureAuthenticated.mockRejectedValue(new Error("auth failed"));

      await expect(service.getLiturgicalData()).rejects.toThrow("auth failed");
      expect(client.getLiturgicalDay).not.toHaveBeenCalled();
    });
  });

  it("delegates reading and feast helpers to the client", () => {
    expect(service.getReadingTeasers(liturgicalDay)).toEqual({
      date: "teasers",
    });
    expect(service.getReadingTexts(liturgicalDay)).toEqual({
      reading1FullText: "text",
    });
    expect(service.getFeastTitle(liturgicalDay)).toEqual({
      feastTitle: "feast",
    });
    expect(client.getReadingTeasers).toHaveBeenCalledWith(liturgicalDay);
    expect(client.getReadingTexts).toHaveBeenCalledWith(liturgicalDay);
    expect(client.getFeastTitle).toHaveBeenCalledWith(liturgicalDay);
  });
});
