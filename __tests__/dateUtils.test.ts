import { formatDateHeading } from "@/utils/dateUtils";

describe("formatDateHeading", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-13T10:00:00.000Z"));
  });

  it("should format today's date correctly", () => {
    const today = new Date("2026-08-13T00:00:00.000Z");
    const formatted = formatDateHeading(today);
    expect(formatted).toBe("Today, 13 August");
  });

  it("should format tomorrow's date correctly", () => {
    const tomorrow = new Date("2026-08-14T00:00:00.000Z");
    const formatted = formatDateHeading(tomorrow);
    expect(formatted).toBe("Tomorrow, 14 August");
  });

  it("should format other dates correctly", () => {
    const otherDate = new Date("2026-08-15T00:00:00.000Z");
    const formatted = formatDateHeading(otherDate);
    expect(formatted).toBe("Saturday, 15 August");
  });

  it("should format dates in the past correctly", () => {
    const pastDate = new Date("2026-08-12T00:00:00.000Z");
    const formatted = formatDateHeading(pastDate);
    expect(formatted).toBe("Wednesday, 12 August");
  });

  it("should format dates correctly on the month boundary", () => {
    jest.setSystemTime(new Date("2026-08-31T10:00:00.000Z")); // Set current date to August 31, 2026
    const monthBoundaryDate = new Date("2026-09-01T00:00:00.000Z");
    const formatted = formatDateHeading(monthBoundaryDate);
    expect(formatted).toBe("Tomorrow, 1 September");
  });

  it("should format dates correctly on the year boundary", () => {
    jest.setSystemTime(new Date("2026-12-31T10:00:00.000Z")); // Set current date to December 31, 2026
    const yearBoundaryDate = new Date("2027-01-01T00:00:00.000Z");
    const formatted = formatDateHeading(yearBoundaryDate);
    expect(formatted).toBe("Tomorrow, 1 January");
  });

  it("should format dates correctly for next year", () => {
    const nextYearDate = new Date("2027-03-05T00:00:00.000Z");
    const formatted = formatDateHeading(nextYearDate);
    expect(formatted).toBe("Friday, 5 March");
  });

  it("should format dates correctly around midnight", () => {
    jest.setSystemTime(new Date("2026-08-13T13:59:59.000Z"));
    const beforeMidnight = new Date("2026-08-13T13:59:59.000Z");
    expect(formatDateHeading(beforeMidnight)).toBe("Today, 13 August");

    jest.setSystemTime(new Date("2026-08-13T14:00:00.000Z"));
    const afterMidnight = new Date("2026-08-13T14:00:00.000Z");
    expect(formatDateHeading(afterMidnight)).toBe("Today, 14 August");
  });

  it("should handle Sydney daylight saving time correctly", () => {
    jest.setSystemTime(new Date("2026-10-03T13:00:00.000Z")); // 23:00 Sydney
    const tomorrow = new Date("2026-10-04T12:00:00.000Z");
    const formatted = formatDateHeading(tomorrow);
    expect(formatted).toBe("Tomorrow, 4 October");
  });
});
