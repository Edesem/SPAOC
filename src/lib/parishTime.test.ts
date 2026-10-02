import {
  APP_TIME_ZONE,
  atParishHour,
  endOfParishDay,
  getParishDateParts,
  isSameParishMonth,
  now,
  parishDayKey,
  parishDaysBetween,
  resetNow,
  setNow,
  startOfParishDay,
  startOfParishDayFromKey,
} from "@/lib/parishTime";

const iso = (date: Date) => date.toISOString();

describe("APP_TIME_ZONE", () => {
  it("is Melbourne", () => {
    expect(APP_TIME_ZONE).toBe("Australia/Melbourne");
  });
});

describe("now", () => {
  afterEach(() => {
    resetNow();
    jest.useRealTimers();
  });

  it("follows the real clock by default", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-13T10:00:00Z"));

    expect(iso(now())).toBe("2026-08-13T10:00:00.000Z");
  });

  it("returns the injected clock until it is reset", () => {
    setNow(() => new Date("2020-01-02T03:04:05Z"));
    expect(iso(now())).toBe("2020-01-02T03:04:05.000Z");

    resetNow();
    expect(now().getFullYear()).toBeGreaterThanOrEqual(2026);
  });
});

describe("getParishDateParts", () => {
  it("reads the parts in Melbourne time", () => {
    // 2026-08-13T14:00Z is midnight on Friday the 14th in Melbourne
    expect(getParishDateParts(new Date("2026-08-13T14:00:00Z"))).toEqual({
      year: 2026,
      month: 8,
      day: 14,
      weekday: "Friday",
    });
  });
});

describe("parishDayKey", () => {
  it.each([
    ["standard time, just before midnight", "2026-08-13T13:59:59.999Z", "2026-08-13"],
    ["standard time, midnight", "2026-08-13T14:00:00.000Z", "2026-08-14"],
    ["daylight saving, just before midnight", "2026-12-01T12:59:59.999Z", "2026-12-01"],
    ["daylight saving, midnight", "2026-12-01T13:00:00.000Z", "2026-12-02"],
    ["early morning, still the local day before the UTC day", "2026-08-15T22:00:00.000Z", "2026-08-16"],
    ["the year boundary", "2026-12-31T13:00:00.000Z", "2027-01-01"],
  ])("keys %s", (_, instant, key) => {
    expect(parishDayKey(new Date(instant))).toBe(key);
  });
});

describe("startOfParishDay / endOfParishDay", () => {
  it("bounds a standard time day at +10:00", () => {
    const date = new Date("2026-08-13T05:30:00Z"); // 3:30pm Melbourne

    expect(iso(startOfParishDay(date))).toBe("2026-08-12T14:00:00.000Z");
    expect(iso(endOfParishDay(date))).toBe("2026-08-13T13:59:59.999Z");
  });

  it("bounds a daylight saving day at +11:00", () => {
    const date = new Date("2026-12-01T05:30:00Z");

    expect(iso(startOfParishDay(date))).toBe("2026-11-30T13:00:00.000Z");
    expect(iso(endOfParishDay(date))).toBe("2026-12-01T12:59:59.999Z");
  });

  it("puts an early-morning instant on the local day, not the UTC day", () => {
    const date = new Date("2026-08-15T22:00:00Z"); // 8am on the 16th

    expect(iso(startOfParishDay(date))).toBe("2026-08-15T14:00:00.000Z");
  });

  it("gives the 23-hour day daylight saving starts on", () => {
    const date = new Date("2026-10-04T00:00:00Z"); // 11am, clocks went forward at 2am

    expect(iso(startOfParishDay(date))).toBe("2026-10-03T14:00:00.000Z");
    expect(iso(endOfParishDay(date))).toBe("2026-10-04T12:59:59.999Z");
  });

  it("gives the 25-hour day daylight saving ends on", () => {
    const date = new Date("2026-04-05T00:00:00Z"); // clocks went back at 3am

    expect(iso(startOfParishDay(date))).toBe("2026-04-04T13:00:00.000Z");
    expect(iso(endOfParishDay(date))).toBe("2026-04-05T13:59:59.999Z");
  });

  it("does not mutate its input", () => {
    const date = new Date("2026-08-13T05:30:00Z");

    startOfParishDay(date);
    endOfParishDay(date);

    expect(iso(date)).toBe("2026-08-13T05:30:00.000Z");
  });

  it("moves by parish days across a daylight saving change", () => {
    const date = new Date("2026-10-03T00:00:00Z"); // Saturday, the day before

    expect(iso(startOfParishDay(date, 1))).toBe("2026-10-03T14:00:00.000Z");
    expect(iso(startOfParishDay(date, 2))).toBe("2026-10-04T13:00:00.000Z");
    expect(iso(startOfParishDay(date, -1))).toBe("2026-10-01T14:00:00.000Z");
  });

  it("rolls over month and year ends", () => {
    const date = new Date("2026-12-31T00:00:00Z");

    expect(parishDayKey(startOfParishDay(date, 1))).toBe("2027-01-01");
    expect(parishDayKey(startOfParishDay(date, -31))).toBe("2026-11-30");
  });
});

describe("startOfParishDayFromKey", () => {
  it("returns parish midnight at +10:00 in standard time", () => {
    expect(iso(startOfParishDayFromKey("2026-08-13"))).toBe(
      "2026-08-12T14:00:00.000Z",
    );
  });

  it("returns parish midnight at +11:00 in daylight saving time", () => {
    expect(iso(startOfParishDayFromKey("2026-12-01"))).toBe(
      "2026-11-30T13:00:00.000Z",
    );
  });

  it("round-trips through parishDayKey", () => {
    expect(parishDayKey(startOfParishDayFromKey("2026-12-31"))).toBe(
      "2026-12-31",
    );
  });

  it.each(["", "2026-8-13", "2026-02-30", "2026-02-30x", "13/08/2026"])(
    "throws a RangeError for %p",
    (key) => {
      expect(() => startOfParishDayFromKey(key)).toThrow(RangeError);
    },
  );
});

describe("atParishHour", () => {
  it("gives the hour on the parish day in standard time", () => {
    const date = new Date("2026-08-13T05:30:00Z");

    expect(iso(atParishHour(date, 8))).toBe("2026-08-12T22:00:00.000Z");
  });

  it("gives the hour on the parish day in daylight saving time", () => {
    const date = new Date("2026-12-01T05:30:00Z");

    expect(iso(atParishHour(date, 9))).toBe("2026-11-30T22:00:00.000Z");
  });

  it("offsets by whole parish days, keeping the wall-clock hour across a change", () => {
    const date = new Date("2026-10-06T00:00:00Z"); // after daylight saving started

    // 9am on the 1st is still +10:00; on the 6th it is +11:00
    expect(iso(atParishHour(date, 9, -5))).toBe("2026-09-30T23:00:00.000Z");
  });

  it("uses the parish day even when the UTC day differs", () => {
    const date = new Date("2026-08-15T22:00:00Z"); // 8am on the 16th

    expect(iso(atParishHour(date, 8))).toBe("2026-08-15T22:00:00.000Z");
  });
});

describe("isSameParishMonth", () => {
  it("is true within a month", () => {
    expect(
      isSameParishMonth(
        new Date("2026-03-10T12:00:00Z"),
        new Date("2026-03-25T12:00:00Z"),
      ),
    ).toBe(true);
  });

  it("is false for the same month in another year", () => {
    expect(
      isSameParishMonth(
        new Date("2026-03-10T12:00:00Z"),
        new Date("2027-03-10T12:00:00Z"),
      ),
    ).toBe(false);
  });

  it("uses the Melbourne month at a month boundary", () => {
    // 2026-02-28T14:00Z is already 1 March in Melbourne
    const march = new Date("2026-02-28T14:00:00Z");

    expect(isSameParishMonth(march, new Date("2026-03-15T12:00:00Z"))).toBe(true);
    expect(isSameParishMonth(march, new Date("2026-02-15T12:00:00Z"))).toBe(false);
  });
});

describe("parishDaysBetween", () => {
  it("counts calendar days regardless of the time of day", () => {
    expect(
      parishDaysBetween(
        new Date("2026-08-13T00:00:00+10:00"),
        new Date("2026-08-16T23:59:59+10:00"),
      ),
    ).toBe(3);
  });

  it("is negative going backwards", () => {
    expect(
      parishDaysBetween(
        new Date("2026-08-13T12:00:00Z"),
        new Date("2026-08-01T12:00:00Z"),
      ),
    ).toBe(-12);
  });

  it("counts a day across a daylight saving change as one", () => {
    expect(
      parishDaysBetween(
        new Date("2026-10-03T12:00:00+10:00"),
        new Date("2026-10-04T12:00:00+11:00"),
      ),
    ).toBe(1);
  });
});
