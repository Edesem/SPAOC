import { resetNow, setNow } from "@/lib/parishTime";
import { formatEventDate, formatEventTimes } from "./eventTimes";

describe("formatEventTimes", () => {
  it("labels an all-day event 'All day' with no end", () => {
    expect(
      formatEventTimes("2099-08-14T14:00:00.000Z", "2099-08-15T14:00:00.000Z", true),
    ).toEqual({ start: "All day", end: "" });
  });

  it("formats a timed event as a start time and a 'to' end time", () => {
    const { start, end } = formatEventTimes(
      "2099-08-15T10:00:00.000Z",
      "2099-08-15T12:00:00.000Z",
      false,
    );

    expect(start).toMatch(/\d{1,2}:\d{2}/);
    expect(end).toMatch(/^to \d{1,2}:\d{2}/);
  });

  // Jest runs as a device in Los Angeles (jest.global-setup.js), where this
  // instant is the evening of 14 August.
  it("shows times in parish time, not the device's time zone", () => {
    expect(
      formatEventTimes(
        "2099-08-15T00:00:00.000Z",
        "2099-08-15T02:30:00.000Z",
        false,
      ),
    ).toEqual({ start: "10:00 AM", end: "to 12:30 PM" });
  });
});

describe("formatEventDate", () => {
  beforeEach(() => setNow(() => new Date("2099-06-01T00:00:00.000Z")));
  afterEach(resetNow);

  it("names the weekday, day and month, without the current year", () => {
    expect(
      formatEventDate("2099-08-15T00:00:00.000Z", "2099-08-15T02:30:00.000Z", false),
    ).toBe("Saturday 15 August");
  });

  it("adds the year when the event isn't in the current year", () => {
    expect(
      formatEventDate("2100-01-09T00:00:00.000Z", "2100-01-09T02:00:00.000Z", false),
    ).toBe("Saturday 9 January 2100");
  });

  // Jest runs as a device in Los Angeles, where this instant is still the 14th.
  it("uses the parish day, not the device's", () => {
    expect(
      formatEventDate("2099-08-14T14:00:00.000Z", "2099-08-14T15:00:00.000Z", false),
    ).toBe("Saturday 15 August");
  });

  it("shows a single day for an all-day event, whose end is the next midnight", () => {
    expect(
      formatEventDate("2099-08-14T14:00:00.000Z", "2099-08-15T14:00:00.000Z", true),
    ).toBe("Saturday 15 August");
  });

  it("shows the first and last day of a multi-day all-day event", () => {
    expect(
      formatEventDate("2099-08-14T14:00:00.000Z", "2099-08-17T14:00:00.000Z", true),
    ).toBe("Saturday 15 August to Monday 17 August");
  });
});
