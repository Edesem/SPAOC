import { APP_TIME_ZONE, atParishHour, parishDayKey } from "@/domain/parishTime";
import type { EventData } from "@/types/global";

// Pure planning for local notifications: given what the app knows, which
// notifications should exist? Nothing here touches React, Expo, AsyncStorage
// or the clock, so the answer depends only on the arguments. Scheduling,
// listing and cancelling with Expo belong to a gateway, and comparing this
// plan with what is scheduled belongs to a reconcile step (see
// docs/notification-planner.md).

export const SAINT_NOTIFICATION_TITLE = "Saint of the Day";
const SAINT_NOTIFICATION_HOUR = 8;
const CALENDAR_NOTIFICATION_HOUR = 9;
const DEFAULT_DAYS_BEFORE = 1;

// iOS keeps only the soonest 64 pending local notifications and drops the rest
// without telling us, so a plan stays under that with a little room to spare.
export const MAX_PLANNED_NOTIFICATIONS = 60;

export type NotificationKind = "saint" | "favourite" | "calendar";

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

// Per-calendar choice, keyed by the calendar's name (an event's `source`).
// Matches CalendarNotificationSetting in services/settings, which the domain
// does not import.
export type CalendarNotificationPreference = {
  enabled: boolean;
  daysBefore: number;
};

export type NotificationSettings = {
  dailySaintsEnabled: boolean;
  favouritesEnabled: boolean;
  calendars: Record<string, CalendarNotificationPreference>;
};

export type NotificationPlanInput = {
  saints: SaintDay[];
  favourites: EventData[];
  // Upcoming parish events from every calendar; each carries its `source`
  events: EventData[];
  settings: NotificationSettings;
  now: Date;
};

const byFireTime = (a: PlannedNotification, b: PlannedNotification) =>
  a.fireAt.getTime() - b.fireAt.getTime();

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

  return [...planned.values()].sort(byFireTime);
};

export const calendarNotificationKey = (event: EventData): string =>
  `calendar:${event.source}:${event.id}`;

const formatParishTime = (date: Date): string =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

// For each event on a calendar that is switched on, a notification at 9am
// parish time `daysBefore` days before the event, unless that has passed.
// Events from calendars that are off or unknown, or with an unreadable start,
// plan nothing.
export const planCalendarNotifications = (
  events: EventData[],
  calendars: Record<string, CalendarNotificationPreference>,
  now: Date,
): PlannedNotification[] => {
  const planned = new Map<string, PlannedNotification>();

  for (const event of events) {
    const preference = calendars[event.source];
    if (!preference?.enabled) continue;

    const start = new Date(event.start);
    if (Number.isNaN(start.getTime())) continue;

    const key = calendarNotificationKey(event);
    if (planned.has(key)) continue;

    const fireAt = atParishHour(
      start,
      CALENDAR_NOTIFICATION_HOUR,
      -(preference.daysBefore ?? DEFAULT_DAYS_BEFORE),
    );
    if (fireAt < now) continue;

    planned.set(key, {
      key,
      kind: "calendar",
      title: `${event.title} coming up!`,
      body: event.allDay ? "All day" : `Start time: ${formatParishTime(start)}`,
      fireAt,
    });
  }

  return [...planned.values()].sort(byFireTime);
};

// TODO: sketch only. Which favourites notify, and how far ahead, is still a
// product decision. When decided, the key should be `favourite:${event.id}`
// so a notification can be cancelled by event rather than by matching titles.
export const planFavouriteNotifications = (
  _favourites: EventData[],
  _now: Date,
): PlannedNotification[] => [];

// Everything that should be scheduled right now, soonest first and no more
// than MAX_PLANNED_NOTIFICATIONS. A kind whose setting is off plans nothing, so
// reconciling cancels any of that kind still scheduled.
export const planNotifications = ({
  saints,
  favourites,
  events,
  settings,
  now,
}: NotificationPlanInput): PlannedNotification[] =>
  [
    ...(settings.dailySaintsEnabled ? planSaintNotifications(saints, now) : []),
    ...(settings.favouritesEnabled
      ? planFavouriteNotifications(favourites, now)
      : []),
    ...planCalendarNotifications(events, settings.calendars, now),
  ]
    .sort(byFireTime)
    .slice(0, MAX_PLANNED_NOTIFICATIONS);

// A notification the gateway found scheduled with Expo. The gateway stores
// `key`, `kind` and `fireAt` in the notification's data when it schedules, and
// reads them back here rather than inferring them from Expo's trigger, whose
// shape varies. Anything scheduled before that (no stored key) comes back with
// `key` null, and `kind` null unless the gateway can tell, e.g. from the
// "Saint of the Day" title. `identifier` is Expo's id, which cancelling needs.
export type ScheduledNotification = {
  identifier: string;
  key: string | null;
  kind: NotificationKind | null;
  title: string;
  body: string;
  fireAt: Date | null;
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
  planned.fireAt.getTime() === scheduled.fireAt?.getTime();

// What to change so that scheduled matches planned, for the given kinds only.
// A kind is left out when its inputs could not be loaded (say the saints
// fetch failed), so a failed load never cancels what is already scheduled.
// Within the kinds, a scheduled notification that is not planned, has changed,
// is a duplicate, or has no key is cancelled, and a changed one is scheduled
// again. One with no key and no kind is an old notification from before keys
// existed, so it is always cancelled.
export const reconcileNotifications = (
  planned: PlannedNotification[],
  scheduled: ScheduledNotification[],
  kinds: NotificationKind[],
): ReconcileResult => {
  const inScope = (kind: NotificationKind | null) =>
    kind === null || kinds.includes(kind);
  const plannedByKey = new Map(
    planned.filter((p) => inScope(p.kind)).map((p) => [p.key, p]),
  );
  const kept = new Set<string>();
  const toCancel: ScheduledNotification[] = [];

  for (const existing of scheduled) {
    if (!inScope(existing.kind)) continue;

    const wanted =
      existing.key === null ? undefined : plannedByKey.get(existing.key);
    if (wanted && !kept.has(wanted.key) && sameContent(wanted, existing)) {
      kept.add(wanted.key);
    } else {
      toCancel.push(existing);
    }
  }

  return {
    toSchedule: [...plannedByKey.values()].filter((p) => !kept.has(p.key)),
    toCancel,
  };
};
