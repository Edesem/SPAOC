import {
  MAX_PLANNED_NOTIFICATIONS,
  planCalendarNotifications,
  planFavouriteNotifications,
  planNotifications,
  planSaintNotifications,
  reconcileNotifications,
  saintNotificationKey,
  type CalendarNotificationPreference,
  type NotificationSettings,
  type PlannedNotification,
  type SaintDay,
  type ScheduledNotification,
} from "@/domain/notificationPlanner";
import { atParishHour } from "@/lib/parishTime";
import type { EventData } from "@/types/global";

const iso = (date: Date) => date.toISOString();

// Tuesday 29 September 2026, 10:00 in Melbourne (AEST, UTC+10)
const NOW = new Date("2026-09-29T00:00:00Z");

// Midday in Melbourne on the given day offset from NOW's parish day
const saintDay = (offset: number, ...names: string[]): SaintDay => ({
  date: atParishHour(NOW, 12, offset),
  names,
});

describe("planSaintNotifications", () => {
  it("plans one 8am notification for each of the next seven days", () => {
    const saints = Array.from({ length: 7 }, (_, i) =>
      saintDay(i + 1, `Saint ${i + 1}`),
    );

    const planned = planSaintNotifications(saints, NOW);

    expect(planned).toHaveLength(7);
    planned.forEach((notification, i) => {
      expect(notification.kind).toBe("saint");
      expect(notification.title).toBe("Saint of the Day");
      expect(notification.body).toBe(`Saint ${i + 1}`);
      expect(iso(notification.fireAt)).toBe(iso(atParishHour(NOW, 8, i + 1)));
    });
  });

  it("fires at 8am Melbourne time across the daylight saving change", () => {
    // DST starts on Sunday 4 October 2026
    const planned = planSaintNotifications(
      [saintDay(4, "Before"), saintDay(5, "After")],
      NOW,
    );

    expect(planned.map((n) => iso(n.fireAt))).toEqual([
      "2026-10-02T22:00:00.000Z", // Sat 3 Oct 08:00 AEST
      "2026-10-03T21:00:00.000Z", // Sun 4 Oct 08:00 AEDT
    ]);
  });

  it("joins several saints on one day into the body", () => {
    const [planned] = planSaintNotifications(
      [saintDay(1, "Saint A", "Saint B")],
      NOW,
    );

    expect(planned.body).toBe("Saint A, Saint B");
  });

  it("skips days with no saints", () => {
    expect(planSaintNotifications([saintDay(1)], NOW)).toEqual([]);
  });

  it("skips a day whose 8am has already passed", () => {
    // NOW is 10am on the 29th, so 8am that day is gone
    expect(planSaintNotifications([saintDay(0, "Saint A")], NOW)).toEqual([]);
  });

  it("plans 8am today when it has not happened yet", () => {
    const earlyMorning = new Date("2026-09-28T20:00:00Z"); // 06:00 on the 29th

    const planned = planSaintNotifications(
      [saintDay(0, "Saint A")],
      earlyMorning,
    );

    expect(planned.map((n) => iso(n.fireAt))).toEqual([
      "2026-09-28T22:00:00.000Z",
    ]);
  });

  it("keeps the first entry when a day is listed twice", () => {
    const planned = planSaintNotifications(
      [saintDay(1, "First"), saintDay(1, "Second")],
      NOW,
    );

    expect(planned.map((n) => n.body)).toEqual(["First"]);
  });

  it("returns notifications in the order they fire", () => {
    const planned = planSaintNotifications(
      [saintDay(3, "Later"), saintDay(1, "Sooner")],
      NOW,
    );

    expect(planned.map((n) => n.body)).toEqual(["Sooner", "Later"]);
  });

  it("keys each notification by its parish day", () => {
    const [planned] = planSaintNotifications([saintDay(1, "Saint A")], NOW);

    expect(planned.key).toBe("saint:2026-09-30");
    expect(planned.key).toBe(saintNotificationKey(saintDay(1).date));
  });

  it("gives the same key for any instant on the same parish day", () => {
    const morning = atParishHour(NOW, 1, 1);
    const evening = atParishHour(NOW, 23, 1);

    expect(saintNotificationKey(morning)).toBe(saintNotificationKey(evening));
  });
});

// A calendar event starting at the given instant
const event = (
  source: string,
  id: string,
  start: Date,
  overrides: Partial<EventData> = {},
): EventData =>
  ({
    id,
    source,
    title: `Event ${id}`,
    start: start.toISOString(),
    allDay: false,
    ...overrides,
  }) as EventData;

const on = (daysBefore = 1): CalendarNotificationPreference => ({
  enabled: true,
  daysBefore,
});
const off: CalendarNotificationPreference = { enabled: false, daysBefore: 1 };

describe("planCalendarNotifications", () => {
  // 7:30pm on Saturday 3 October 2026 in Melbourne (AEST)
  const start = new Date("2026-10-03T09:30:00Z");

  it("plans 9am parish time the chosen number of days before", () => {
    const [planned] = planCalendarNotifications(
      [event("youth", "e1", start)],
      { youth: on(2) },
      NOW,
    );

    expect(planned.kind).toBe("calendar");
    expect(planned.key).toBe("calendar:youth:e1");
    expect(planned.title).toBe("Event e1 coming up!");
    expect(planned.body).toMatch(/^Start time: 7:30\s?pm$/i);
    // 9am Thursday 1 October (AEST)
    expect(iso(planned.fireAt)).toBe("2026-09-30T23:00:00.000Z");
  });

  it("defaults to one day before when daysBefore is missing", () => {
    const [planned] = planCalendarNotifications(
      [event("youth", "e1", start)],
      { youth: { enabled: true } as CalendarNotificationPreference },
      NOW,
    );

    // 9am Friday 2 October (AEST)
    expect(iso(planned.fireAt)).toBe("2026-10-01T23:00:00.000Z");
  });

  it("says all day for all-day events", () => {
    const [planned] = planCalendarNotifications(
      [event("church", "e1", start, { allDay: true })],
      { church: on() },
      NOW,
    );

    expect(planned.body).toBe("All day");
  });

  it("plans nothing for calendars that are off or unknown", () => {
    const planned = planCalendarNotifications(
      [event("youth", "e1", start), event("church", "e2", start)],
      { youth: off },
      NOW,
    );

    expect(planned).toEqual([]);
  });

  it("plans only the calendars that are on", () => {
    const planned = planCalendarNotifications(
      [event("youth", "e1", start), event("church", "e2", start)],
      { youth: on(), church: off },
      NOW,
    );

    expect(planned.map((n) => n.key)).toEqual(["calendar:youth:e1"]);
  });

  it("skips events whose notification time has passed", () => {
    // Starts tomorrow evening, but the 9am a day before was this morning
    const soon = new Date("2026-09-30T09:00:00Z");

    expect(
      planCalendarNotifications(
        [event("youth", "e1", soon)],
        { youth: on() },
        NOW,
      ),
    ).toEqual([]);
  });

  it("skips events with an unreadable start", () => {
    expect(
      planCalendarNotifications(
        [event("youth", "e1", start, { start: "not a date" })],
        { youth: on() },
        NOW,
      ),
    ).toEqual([]);
  });

  it("keeps the same key when the lead time changes, so it can be rescheduled", () => {
    const [a] = planCalendarNotifications(
      [event("youth", "e1", start)],
      { youth: on(1) },
      NOW,
    );
    const [b] = planCalendarNotifications(
      [event("youth", "e1", start)],
      { youth: on(3) },
      NOW,
    );

    expect(a.key).toBe(b.key);
    expect(a.fireAt).not.toEqual(b.fireAt);
  });
});

describe("planFavouriteNotifications", () => {
  it("is not decided yet and plans nothing", () => {
    const favourite = { id: "evt-1", title: "Feast" } as EventData;

    expect(planFavouriteNotifications([favourite], NOW)).toEqual([]);
  });
});

describe("planNotifications", () => {
  const saints = [saintDay(1, "Saint A")];
  const start = new Date("2026-10-10T09:30:00Z");
  const events = [event("youth", "e1", start)];
  const settings: NotificationSettings = {
    dailySaintsEnabled: true,
    favouritesEnabled: true,
    calendars: { youth: on() },
  };
  const plan = (overrides: Partial<NotificationSettings> = {}) =>
    planNotifications({
      saints,
      favourites: [],
      events,
      settings: { ...settings, ...overrides },
      now: NOW,
    }).map((n) => n.key);

  it("plans saints and calendar events together, soonest first", () => {
    expect(plan()).toEqual(["saint:2026-09-30", "calendar:youth:e1"]);
  });

  it("plans no saints when daily saint notifications are off", () => {
    expect(plan({ dailySaintsEnabled: false })).toEqual(["calendar:youth:e1"]);
  });

  it("plans no events for a calendar that is turned off", () => {
    expect(plan({ calendars: { youth: off } })).toEqual(["saint:2026-09-30"]);
  });

  it("plans nothing when everything is off", () => {
    expect(
      plan({ dailySaintsEnabled: false, calendars: { youth: off } }),
    ).toEqual([]);
  });

  it("keeps only the soonest notifications when over the limit", () => {
    const many = Array.from({ length: MAX_PLANNED_NOTIFICATIONS + 5 }, (_, i) =>
      event("youth", `e${i}`, new Date(start.getTime() + i * 86_400_000)),
    );

    const planned = planNotifications({
      saints: [],
      favourites: [],
      events: many,
      settings: { ...settings, dailySaintsEnabled: false },
      now: NOW,
    });

    expect(planned).toHaveLength(MAX_PLANNED_NOTIFICATIONS);
    expect(planned[0].key).toBe("calendar:youth:e0");
    expect(planned.at(-1)?.key).toBe(
      `calendar:youth:e${MAX_PLANNED_NOTIFICATIONS - 1}`,
    );
  });
});

describe("reconcileNotifications", () => {
  const planned = (
    day: string,
    body: string,
    kind: PlannedNotification["kind"] = "saint",
  ): PlannedNotification => ({
    key: `${kind}:${day}`,
    kind,
    title: kind === "saint" ? "Saint of the Day" : "Event coming up!",
    body,
    fireAt: new Date(`${day}T08:00:00+10:00`),
  });

  const scheduled = (
    identifier: string,
    from: PlannedNotification,
    overrides: Partial<ScheduledNotification> = {},
  ): ScheduledNotification => ({
    identifier,
    key: from.key,
    kind: from.kind,
    title: from.title,
    body: from.body,
    fireAt: from.fireAt,
    ...overrides,
  });

  const saint = ["saint" as const];
  const all = ["saint" as const, "favourite" as const, "calendar" as const];

  it("schedules everything when nothing is scheduled", () => {
    const a = planned("2026-09-30", "A");

    expect(reconcileNotifications([a], [], saint)).toEqual({
      toSchedule: [a],
      toCancel: [],
    });
  });

  it("does nothing when the schedule already matches the plan", () => {
    const a = planned("2026-09-30", "A");

    expect(reconcileNotifications([a], [scheduled("x1", a)], saint)).toEqual({
      toSchedule: [],
      toCancel: [],
    });
  });

  it("cancels notifications that are no longer planned", () => {
    const stale = scheduled("x1", planned("2026-09-30", "A"));

    expect(reconcileNotifications([], [stale], saint)).toEqual({
      toSchedule: [],
      toCancel: [stale],
    });
  });

  it("cancels and reschedules a notification whose content changed", () => {
    const after = planned("2026-09-30", "New");
    const outdated = scheduled("x1", planned("2026-09-30", "Old"));

    expect(reconcileNotifications([after], [outdated], saint)).toEqual({
      toSchedule: [after],
      toCancel: [outdated],
    });
  });

  it("cancels and reschedules a notification whose time changed", () => {
    const a = planned("2026-09-30", "A");
    const moved = scheduled("x1", a, {
      fireAt: new Date("2026-09-29T08:00:00+10:00"),
    });

    expect(reconcileNotifications([a], [moved], saint)).toEqual({
      toSchedule: [a],
      toCancel: [moved],
    });
  });

  it("treats a notification whose time cannot be read as changed", () => {
    const a = planned("2026-09-30", "A");
    const unreadable = scheduled("x1", a, { fireAt: null });

    expect(reconcileNotifications([a], [unreadable], saint)).toEqual({
      toSchedule: [a],
      toCancel: [unreadable],
    });
  });

  it("cancels the extra copies when a notification is scheduled twice", () => {
    const a = planned("2026-09-30", "A");
    const second = scheduled("x2", a);

    expect(
      reconcileNotifications([a], [scheduled("x1", a), second], saint),
    ).toEqual({ toSchedule: [], toCancel: [second] });
  });

  it("cancels old notifications that have no key or kind", () => {
    const a = planned("2026-09-30", "A");
    const old = scheduled("x9", a, { key: null, kind: null });

    expect(reconcileNotifications([a], [old], saint)).toEqual({
      toSchedule: [a],
      toCancel: [old],
    });
  });

  it("cancels an old saint notification that has a kind but no key", () => {
    const a = planned("2026-09-30", "A");
    const old = scheduled("x9", a, { key: null });

    expect(reconcileNotifications([a], [old], saint)).toEqual({
      toSchedule: [a],
      toCancel: [old],
    });
  });

  it("leaves kinds it was not asked about alone", () => {
    const calendar = scheduled("x1", planned("2026-10-10", "E", "calendar"));
    const saintOld = scheduled("x2", planned("2026-09-30", "A"));

    // Saints failed to load, so only calendar events are reconciled
    expect(
      reconcileNotifications([], [calendar, saintOld], ["calendar"]),
    ).toEqual({ toSchedule: [], toCancel: [calendar] });
  });

  it("does not schedule planned notifications of kinds it was not asked about", () => {
    const a = planned("2026-09-30", "A");

    expect(reconcileNotifications([a], [], ["calendar"])).toEqual({
      toSchedule: [],
      toCancel: [],
    });
  });

  it("cancels everything of a kind that is switched off", () => {
    const a = scheduled("x1", planned("2026-09-30", "A"));
    const b = scheduled("x2", planned("2026-10-01", "B"));

    expect(reconcileNotifications([], [a, b], all)).toEqual({
      toSchedule: [],
      toCancel: [a, b],
    });
  });
});
