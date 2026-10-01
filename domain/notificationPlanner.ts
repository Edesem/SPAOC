import { atParishHour, parishDayKey } from "@/domain/parishTime";
import type { EventData } from "@/types/global";

// Pure planning for local notifications: given what the app knows, which
// notifications should exist? Nothing here touches React, Expo, AsyncStorage
// or the clock, so the answer depends only on the arguments. Scheduling,
// listing and cancelling with Expo belong to a gateway, and comparing this
// plan with what is scheduled belongs to a reconcile step (see
// docs/notification-planner.md).

export const SAINT_NOTIFICATION_TITLE = "Saint of the Day";
const SAINT_NOTIFICATION_HOUR = 8;

export type NotificationKind = "saint" | "favourite";

// One notification that should exist. `key` is the stable identity used to
// match it against what is already scheduled; it never depends on the title.
export type PlannedNotification = {
  key: string;
  kind: NotificationKind;
  title: string;
  body: string;
  fireAt: Date;
};

// The saints for one parish day. `date` may be any instant on that day.
export type SaintDay = {
  date: Date;
  names: string[];
};

export type NotificationSettings = {
  dailySaintsEnabled: boolean;
  favouritesEnabled: boolean;
};

export type NotificationPlanInput = {
  saints: SaintDay[];
  favourites: EventData[];
  settings: NotificationSettings;
  now: Date;
};

export const saintNotificationKey = (date: Date): string =>
  `saint:${parishDayKey(date)}`;

// A notification at 8am parish time for each day that has saints and whose
// 8am has not passed. A day listed twice keeps its first entry.
export const planSaintNotifications = (
  saints: SaintDay[],
  now: Date,
): PlannedNotification[] => {
  const planned = new Map<string, PlannedNotification>();

  for (const { date, names } of saints) {
    if (names.length === 0) continue;

    const key = saintNotificationKey(date);
    if (planned.has(key)) continue;

    const fireAt = atParishHour(date, SAINT_NOTIFICATION_HOUR);
    if (fireAt < now) continue;

    planned.set(key, {
      key,
      kind: "saint",
      title: SAINT_NOTIFICATION_TITLE,
      body: names.join(", "),
      fireAt,
    });
  }

  return [...planned.values()].sort(
    (a, b) => a.fireAt.getTime() - b.fireAt.getTime(),
  );
};

// TODO: sketch only. Which favourites notify, and how far ahead, is still a
// product decision. When decided, the key should be `favourite:${event.id}`
// so a notification can be cancelled by event rather than by matching titles.
export const planFavouriteNotifications = (
  _favourites: EventData[],
  _now: Date,
): PlannedNotification[] => [];

// Everything that should be scheduled right now. A kind whose setting is off
// plans nothing, so reconciling cancels any of that kind still scheduled.
export const planNotifications = ({
  saints,
  favourites,
  settings,
  now,
}: NotificationPlanInput): PlannedNotification[] => [
  ...(settings.dailySaintsEnabled ? planSaintNotifications(saints, now) : []),
  ...(settings.favouritesEnabled
    ? planFavouriteNotifications(favourites, now)
    : []),
];

// A notification the gateway found scheduled with Expo. `key` is the plan key
// the gateway stored when scheduling (null for anything it did not create) and
// `identifier` is Expo's id, which is what cancelling needs.
export type ScheduledNotification = {
  identifier: string;
  key: string | null;
  title: string;
  body: string;
  fireAt: Date;
};

export type ReconcileResult = {
  toSchedule: PlannedNotification[];
  toCancel: ScheduledNotification[];
};

const sameContent = (
  planned: PlannedNotification,
  scheduled: ScheduledNotification,
): boolean =>
  planned.title === scheduled.title &&
  planned.body === scheduled.body &&
  planned.fireAt.getTime() === scheduled.fireAt.getTime();

// What to change so that scheduled matches planned. Scheduled notifications
// without a key are not ours and are left alone. One that is stale, changed or
// duplicated is cancelled, and a changed one is scheduled again.
export const reconcileNotifications = (
  planned: PlannedNotification[],
  scheduled: ScheduledNotification[],
): ReconcileResult => {
  const plannedByKey = new Map(planned.map((p) => [p.key, p]));
  const kept = new Set<string>();
  const toCancel: ScheduledNotification[] = [];

  for (const existing of scheduled) {
    if (existing.key === null) continue;

    const wanted = plannedByKey.get(existing.key);
    if (wanted && !kept.has(existing.key) && sameContent(wanted, existing)) {
      kept.add(existing.key);
    } else {
      toCancel.push(existing);
    }
  }

  return {
    toSchedule: planned.filter((p) => !kept.has(p.key)),
    toCancel,
  };
};
