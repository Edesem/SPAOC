import antiochian from "./AntiochianApi";

const anchorDate = new Date("2026-08-13T00:00:00.000Z");
const anchorId = 12_345;

const liturgicalDay = {
  originalCalendarDate: "2026-08-13T00:00:00.000Z",
  itemId: anchorId,
  calendarDateLong: "Thursday, 13 August 2026",
  fastDesignation: "",
  feastDayTitle: "  Dormition Fast",
  reading1Title: "  Romans 8:28-39",
  reading1Teaser: "  All things work together for good.",
  reading2Title: "  Matthew 14:22-34",
  reading2Teaser: "  Jesus walks on water.",
  reading3Title: "",
  reading3Teaser: "",
  reading1FullText: "  First reading",
  reading2FullText: "  Second reading",
  reading3FullText: "",
};

type TestableAntiochian = {
  idAnchor?: [Date, number];
  days: Record<string, typeof liturgicalDay>;
  axiosInstance: { get: jest.Mock };
  getIdFromDate: (date: Date) => number;
};

const client = antiochian as unknown as TestableAntiochian;

describe("AntiochianApi", () => {
  beforeEach(() => {
    client.idAnchor = undefined;
    client.days = {};
    client.axiosInstance = { get: jest.fn() };
  });

  describe("getIdFromDate", () => {
    it("returns the anchor ID for the anchor date", () => {
      client.idAnchor = [anchorDate, anchorId];

      expect(client.getIdFromDate(anchorDate)).toBe(anchorId);
    });

    it.each([
      ["the following day", "2026-08-14T00:00:00.000Z", anchorId + 1],
      ["three days later", "2026-08-16T00:00:00.000Z", anchorId + 3],
      ["the previous day", "2026-08-12T00:00:00.000Z", anchorId - 1],
    ])("increments or decrements the ID for %s", (_, date, expectedId) => {
      client.idAnchor = [anchorDate, anchorId];

      expect(client.getIdFromDate(new Date(date))).toBe(expectedId);
    });

    it("throws before the API has supplied an anchor", () => {
      expect(() => client.getIdFromDate(anchorDate)).toThrow(
        "ID Anchor not initialized",
      );
    });
  });

  describe("ensureAuthenticated", () => {
    it("authenticates when no anchor has been set", async () => {
      const authenticate = jest
        .spyOn(antiochian, "authenticate")
        .mockResolvedValue();

      await antiochian.ensureAuthenticated();

      expect(authenticate).toHaveBeenCalledTimes(1);
      authenticate.mockRestore();
    });

    it("skips authentication once the anchor is set", async () => {
      client.idAnchor = [anchorDate, anchorId];
      const authenticate = jest
        .spyOn(antiochian, "authenticate")
        .mockResolvedValue();

      await antiochian.ensureAuthenticated();

      expect(authenticate).not.toHaveBeenCalled();
      authenticate.mockRestore();
    });
  });

  it("caches liturgical days by date", async () => {
    client.idAnchor = [anchorDate, anchorId];
    client.axiosInstance.get.mockResolvedValue({
      status: 200,
      data: { liturgicalDay },
    });

    const first = await antiochian.getLiturgicalDay(anchorDate);
    const second = await antiochian.getLiturgicalDay(anchorDate);

    expect(first).toBe(liturgicalDay);
    expect(second).toBe(liturgicalDay);
    expect(client.axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(client.axiosInstance.get).toHaveBeenCalledWith(
      "https://antiochian.org/api/antiochian/LiturgicalDay/12345",
    );
  });

  it("returns null for non-200 API responses", async () => {
    client.idAnchor = [anchorDate, anchorId];
    client.axiosInstance.get.mockResolvedValue({ status: 500, data: {} });

    await expect(antiochian.getLiturgicalDay(anchorDate)).resolves.toBeNull();
    await expect(antiochian.getLiturgicalText(anchorDate)).resolves.toBeNull();
  });

  it("gets liturgical texts for a date", async () => {
    client.axiosInstance.get.mockResolvedValue({
      status: 200,
      data: [
        {
          publicUrl: "https://example.com",
          typeOfService: "Divine Liturgy",
        },
      ],
    });

    const result = await antiochian.getLiturgicalText(anchorDate);

    expect(result).toEqual([
      {
        publicUrl: "https://example.com",
        typeOfService: "Divine Liturgy",
      },
    ]);

    expect(client.axiosInstance.get).toHaveBeenCalledWith(
      "https://antiochian.org/api/antiochian/LiturgicalTexts/2026-08-13",
    );
  });
});
