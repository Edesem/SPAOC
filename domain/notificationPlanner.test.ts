import {
  planFavouriteNotifications,
  planNotifications,
  planSaintNotifications,
  reconcileNotifications,
  saintNotificationKey,
  type PlannedNotification,
  type SaintDay,
  type ScheduledNotification,
} from "@/domain/notificationPlanner";
import { atParishHour } from "@/domain/parishTime";
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

describe("planFavouriteNotifications", () => {
  it("is not decided yet and plans nothing", () => {
    const favourite = { id: "evt-1", title: "Feast" } as EventData;

    expect(planFavouriteNotifications([favourite], NOW)).toEqual([]);
  });
});

describe("planNotifications", () => {
  const saints = [saintDay(1, "Saint A")];
  const on = { dailySaintsEnabled: true, favouritesEnabled: true };

  it("plans saints when daily saint notifications are on", () => {
    const planned = planNotifications({
      saints,
      favourites: [],
      settings: on,
      now: NOW,
    });

    expect(planned.map((n) => n.key)).toEqual(["saint:2026-09-30"]);
  });

  it("plans nothing for saints when daily saint notifications are off", () => {
    const planned = planNotifications({
      saints,
      favourites: [],
      settings: { ...on, dailySaintsEnabled: false },
      now: NOW,
    });

    expect(planned).toEqual([]);
  });
});

describe("reconcileNotifications", () => {
  const planned = (day: string, body: string): PlannedNotification => ({
    key: `saint:${day}`,
    kind: "saint",
    title: "Saint of the Day",
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
    title: from.title,
    body: from.body,
    fireAt: from.fireAt,
    ...overrides,
  });

  it("schedules everything when nothing is scheduled", () => {
    const a = planned("2026-09-30", "A");

    expect(reconcileNotifications([a], [])).toEqual({
      toSchedule: [a],
      toCancel: [],
    });
  });

  it("does nothing when the schedule already matches the plan", () => {
    const a = planned("2026-09-30", "A");

    expect(reconcileNotifications([a], [scheduled("x1", a)])).toEqual({
      toSchedule: [],
      toCancel: [],
    });
  });

  it("cancels notifications that are no longer planned", () => {
    const a = planned("2026-09-30", "A");
    const stale = scheduled("x1", a);

    expect(reconcileNotifications([], [stale])).toEqual({
      toSchedule: [],
      toCancel: [stale],
    });
  });

  it("cancels and reschedules a notification whose content changed", () => {
    const before = planned("2026-09-30", "Old");
    const after = planned("2026-09-30", "New");
    const outdated = scheduled("x1", before);

    expect(reconcileNotifications([after], [outdated])).toEqual({
      toSchedule: [after],
      toCancel: [outdated],
    });
  });

  it("cancels the extra copies when a notification is scheduled twice", () => {
    const a = planned("2026-09-30", "A");
    const first = scheduled("x1", a);
    const second = scheduled("x2", a);

    expect(reconcileNotifications([a], [first, second])).toEqual({
      toSchedule: [],
      toCancel: [second],
    });
  });

  it("leaves notifications the planner did not create alone", () => {
    const a = planned("2026-09-30", "A");
    const foreign = scheduled("x9", a, { key: null });

    expect(reconcileNotifications([], [foreign])).toEqual({
      toSchedule: [],
      toCancel: [],
    });
  });
});
