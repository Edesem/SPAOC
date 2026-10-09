import {
  formatDateHeading,
  groupEventsByDay,
  getStartOfWeek,
} from "./dateUtils";
import type { EventData } from "../types";
import { resetNow, setNow } from "@/lib/parishTime";

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

  it("should display melbourne time, even if the user is in a different timezone", () => {
    // User is in Paris Thursday 8pm (6 pm UTC)
    // This is 4 am Friday in Melbourne
    // Event is at 9 am Melbourne time, which is 11 pm UTC the previous day
    // The heading should display "Today" because the event is on the same day in Melbourne time
    jest.setSystemTime(new Date("2026-08-13T18:00:00.000Z")); // 20:00 Melbourne
    const eventDate = new Date("2026-08-14T09:00:00.000+10:00");
    expect(formatDateHeading(eventDate)).toBe("Today, 14 August");
  });
});

describe("formatDateHeading with an injected clock", () => {
  afterEach(() => {
    resetNow();
  });

  it("takes today from the parish clock, not the system clock", () => {
    setNow(() => new Date("2026-08-13T10:00:00.000Z"));

    expect(formatDateHeading(new Date("2026-08-13T10:00:00.000Z"))).toBe(
      "Today, 13 August",
    );
    expect(formatDateHeading(new Date("2026-08-14T10:00:00.000Z"))).toBe(
      "Tomorrow, 14 August",
    );
  });
});

describe("getStartOfWeek", () => {
  it("returns Melbourne midnight on the Sunday daylight saving starts", () => {
    const date = new Date("2026-10-07T12:00:00.000+11:00"); // Wednesday
    const startOfWeek = getStartOfWeek(date, "sunday");
    // Sunday 4 October: clocks go forward at 2am, so midnight is still +10:00
    expect(startOfWeek.toISOString()).toBe("2026-10-03T14:00:00.000Z");
  });

  it("returns Melbourne midnight in daylight saving time", () => {
    const date = new Date("2026-12-03T12:00:00.000+11:00"); // Thursday
    const startOfWeek = getStartOfWeek(date, "monday");
    expect(startOfWeek.toISOString()).toBe("2026-11-29T13:00:00.000Z"); // Monday 30 Nov
  });

  it("should return the correct start of the week for Sunday", () => {
    const date = new Date("2026-08-13T00:00:00.000+10:00"); // Thursday
    const startOfWeek = getStartOfWeek(date, "sunday");
    expect(startOfWeek.toISOString()).toBe("2026-08-08T14:00:00.000Z"); // Sunday
  });

  it("should return the correct start of the week for Monday", () => {
    const date = new Date("2026-08-13T00:00:00.000+10:00"); // Thursday
    const startOfWeek = getStartOfWeek(date, "monday");
    expect(startOfWeek.toISOString()).toBe("2026-08-09T14:00:00.000Z"); // Monday
  });

  it("should handle edge case for Sunday when start of week is Sunday", () => {
    const date = new Date("2026-08-09T00:00:00.000+10:00"); // Monday
    const startOfWeek = getStartOfWeek(date, "sunday");
    expect(startOfWeek.toISOString()).toBe("2026-08-08T14:00:00.000Z"); // Sunday
  });
});

describe("groupEventsByDay", () => {
  it("should group events correctly by day", () => {
    jest.setSystemTime(new Date("2026-08-13T08:00:00.000+10:00"));

    const events: EventData[] = [
      {
        id: "1",
        title: "Event 1",
        start: "2026-08-13T10:00:00.000+10:00",
        end: "2026-08-13T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
      {
        id: "2",
        title: "Event 2",
        start: "2026-08-13T12:00:00.000+10:00",
        end: "2026-08-13T13:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "church",
      },
      {
        id: "3",
        title: "Event 3",
        start: "2026-08-14T10:00:00.000+10:00",
        end: "2026-08-14T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
    ];

    const startOfWeek = "sunday";
    const grouped = groupEventsByDay(events, startOfWeek);

    expect(grouped.length).toBe(2);
    expect(grouped[0].title).toBe("Today, 13 August");
    expect(grouped[0].data.length).toBe(2);
    expect(grouped[1].title).toBe("Tomorrow, 14 August");
    expect(grouped[1].data.length).toBe(1);
  });

  it("should group events correctly by day with next week and following week labels", () => {
    jest.setSystemTime(new Date("2026-08-13T08:00:00.000+10:00"));

    const events: EventData[] = [
      {
        id: "1",
        title: "Event 1",
        start: "2026-08-13T10:00:00.000+10:00",
        end: "2026-08-13T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
      {
        id: "2",
        title: "Event 2",
        start: "2026-08-20T12:00:00.000+10:00", // Next week
        end: "2026-08-20T13:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "church",
      },
      {
        id: "3",
        title: "Event 3",
        start: "2026-08-27T10:00:00.000+10:00", // Later
        end: "2026-08-27T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
    ];

    const startOfWeek = "sunday";
    const grouped = groupEventsByDay(events, startOfWeek);

    expect(grouped.length).toBe(3);
    expect(grouped[0].title).toBe("Today, 13 August");
    expect(grouped[0].data.length).toBe(1);
    expect(grouped[0].weekLabel).toBe("This Week");

    expect(grouped[1].title).toBe("Thursday, 20 August");
    expect(grouped[1].data.length).toBe(1);
    expect(grouped[1].weekLabel).toBe("Next Week");

    expect(grouped[2].title).toBe("Thursday, 27 August");
    expect(grouped[2].data.length).toBe(1);
    expect(grouped[2].weekLabel).toBe("Week of 23 August");
  });

  it("should handle events before the current week correctly", () => {
    jest.setSystemTime(new Date("2026-08-13T08:00:00.000+10:00"));

    const events: EventData[] = [
      {
        id: "1",
        title: "Event 1",
        start: "2026-08-06T10:00:00.000+10:00", // Last week
        end: "2026-08-06T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
      {
        id: "2",
        title: "Event 2",
        start: "2026-08-13T12:00:00.000+10:00", // This week
        end: "2026-08-13T13:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "church",
      },
    ];

    const startOfWeek = "sunday";
    const grouped = groupEventsByDay(events, startOfWeek);

    expect(grouped.length).toBe(2);
    expect(grouped[0].title).toBe("Thursday, 6 August");
    expect(grouped[0].data.length).toBe(1);
    expect(grouped[0].weekLabel).toBeUndefined();

    expect(grouped[1].title).toBe("Today, 13 August");
    expect(grouped[1].data.length).toBe(1);
    expect(grouped[1].weekLabel).toBe("This Week");
  });

  it("should sort dates into chronological order", () => {
    jest.setSystemTime(new Date("2026-08-13T08:00:00.000+10:00"));

    const events: EventData[] = [
      {
        id: "3",
        title: "Event 3",
        start: "2026-08-27T10:00:00.000+10:00", // Later
        end: "2026-08-27T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
      {
        id: "2",
        title: "Event 2",
        start: "2026-08-20T12:00:00.000+10:00", // Next week
        end: "2026-08-20T13:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "church",
      },
      {
        id: "1",
        title: "Event 1",
        start: "2026-08-13T10:00:00.000+10:00",
        end: "2026-08-13T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
    ];

    const startOfWeek = "sunday";
    const grouped = groupEventsByDay(events, startOfWeek);

    expect(grouped.length).toBe(3);
    expect(grouped[0].title).toBe("Today, 13 August");
    expect(grouped[0].data.length).toBe(1);
    expect(grouped[0].weekLabel).toBe("This Week");

    expect(grouped[1].title).toBe("Thursday, 20 August");
    expect(grouped[1].data.length).toBe(1);
    expect(grouped[1].weekLabel).toBe("Next Week");

    expect(grouped[2].title).toBe("Thursday, 27 August");
    expect(grouped[2].data.length).toBe(1);
    expect(grouped[2].weekLabel).toBe("Week of 23 August");
  });

  it("handles next week boundaries correctly", () => {
    jest.setSystemTime(new Date("2026-08-13T08:00:00.000+10:00"));

    const events: EventData[] = [
      {
        id: "1",
        title: "Event 1",
        start: "2026-08-16T10:00:00.000+10:00", // This week
        end: "2026-08-16T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
      {
        id: "2",
        title: "Event 2",
        start: "2026-08-17T12:00:00.000+10:00", // Next week
        end: "2026-08-17T13:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "church",
      },
      {
        id: "3",
        title: "Event 3",
        start: "2026-08-23T10:00:00.000+10:00",
        end: "2026-08-23T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
      {
        id: "4",
        title: "Event 4",
        start: "2026-08-24T10:00:00.000+10:00", // Later
        end: "2026-08-24T11:00:00.000+10:00",
        allDay: false,
        description: "",
        location: "",
        source: "youth",
      },
    ];

    const startOfWeek = "monday";
    const grouped = groupEventsByDay(events, startOfWeek);

    expect(grouped.length).toBe(4);
    expect(grouped[0].title).toBe("Sunday, 16 August");
    expect(grouped[0].data.length).toBe(1);
    expect(grouped[0].weekLabel).toBe("This Week");

    expect(grouped[1].title).toBe("Monday, 17 August");
    expect(grouped[1].data.length).toBe(1);
    expect(grouped[1].weekLabel).toBe("Next Week");

    expect(grouped[2].title).toBe("Sunday, 23 August");
    expect(grouped[2].data.length).toBe(1);
    expect(grouped[2].weekLabel).toBeUndefined();

    expect(grouped[3].title).toBe("Monday, 24 August");
    expect(grouped[3].data.length).toBe(1);
    expect(grouped[3].weekLabel).toBe("Week of 24 August");
  });

  it("labels every week after next week once, by the day it starts", () => {
    jest.setSystemTime(new Date("2026-08-13T08:00:00.000+10:00"));

    const event = (id: string, day: string): EventData => ({
      id,
      title: `Event ${id}`,
      start: `2026-${day}T10:00:00.000+10:00`,
      end: `2026-${day}T11:00:00.000+10:00`,
      allDay: false,
      description: "",
      location: "",
      source: "youth",
    });

    // Weeks start on Sunday: 23 Aug, 30 Aug, then 13 Sep (6 Sep has no events).
    const grouped = groupEventsByDay(
      [
        event("1", "08-25"),
        event("2", "08-27"),
        event("3", "09-01"),
        event("4", "09-15"),
      ],
      "sunday",
    );

    expect(grouped.map((section) => section.weekLabel)).toEqual([
      "Week of 23 August",
      undefined,
      "Week of 30 August",
      "Week of 13 September",
    ]);
  });

  it("handles empty input", () => {
    const grouped = groupEventsByDay([], "sunday");

    expect(grouped.length).toBe(0);
    expect(grouped).toStrictEqual([]);
  });
});
