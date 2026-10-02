import {
  parseEventDetailsParams,
  toEventDetailsParams,
} from "@/utils/routeParams";

const event = {
  id: "event-1",
  title: "Divine Liturgy",
  start: "2099-08-15T10:00:00.000Z",
  end: "2099-08-15T12:00:00.000Z",
  allDay: false,
  description: "Sunday service",
  location: "St Paul's",
  source: "church",
  data: [],
};

describe("event details route params", () => {
  it("carries the raw ISO times and the all-day flag as strings", () => {
    expect(toEventDetailsParams(event)).toEqual({
      id: "event-1",
      title: "Divine Liturgy",
      start: "2099-08-15T10:00:00.000Z",
      end: "2099-08-15T12:00:00.000Z",
      allDay: "false",
      description: "Sunday service",
      location: "St Paul's",
      source: "church",
    });
  });

  it("round-trips an all-day event", () => {
    const allDay = { ...event, allDay: true };

    expect(parseEventDetailsParams(toEventDetailsParams(allDay))).toMatchObject({
      start: allDay.start,
      end: allDay.end,
      allDay: true,
    });
  });

  it("leaves a missing description and location undefined", () => {
    const { description, location } = parseEventDetailsParams({
      id: "event-1",
      title: "Divine Liturgy",
      start: event.start,
      end: event.end,
      allDay: "false",
      source: "church",
    });

    expect(description).toBeUndefined();
    expect(location).toBeUndefined();
  });
});
