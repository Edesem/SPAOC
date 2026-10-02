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
  {
    publicUrl: "https://example.com",
    typeOfService: "Divine Liturgy (PDF)",
  },
];

const mappedDay = {
  feastTitle: "Dormition Fast",
  readings: [
    {
      kind: "epistle",
      title: "Romans 8:28-39",
      teaser: "All things work together for good.",
      fullText: "First reading",
    },
    {
      kind: "gospel",
      title: "Matthew 14:22-34",
      teaser: "Jesus walks on water.",
      fullText: "Second reading",
    },
  ],
};

const createClient = (): jest.Mocked<AntiochianClient> => ({
  ensureAuthenticated: jest.fn().mockResolvedValue(undefined),
  getLiturgicalDay: jest.fn().mockResolvedValue(liturgicalDay),
  getLiturgicalText: jest.fn().mockResolvedValue(texts),
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
        day: mappedDay,
        services: [{ title: "Divine Liturgy", pdfUrl: "https://example.com" }],
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

    it("maps missing provider results to null", async () => {
      client.getLiturgicalDay.mockResolvedValue(null);
      client.getLiturgicalText.mockResolvedValue(null);

      await expect(service.getLiturgicalData()).resolves.toEqual({
        day: null,
        services: null,
      });
    });

    it("propagates provider errors", async () => {
      client.ensureAuthenticated.mockRejectedValue(new Error("auth failed"));

      await expect(service.getLiturgicalData()).rejects.toThrow("auth failed");
      expect(client.getLiturgicalDay).not.toHaveBeenCalled();
    });
  });
});
