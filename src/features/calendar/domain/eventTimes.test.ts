import { formatEventTimes } from "./eventTimes";

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
});
