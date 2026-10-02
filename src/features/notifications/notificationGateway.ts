import {
  SAINT_NOTIFICATION_TITLE,
  type NotificationKind,
  type PlannedNotification,
  type ScheduledNotification,
} from "./notificationPlanner";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Schedules, lists and cancels local notifications with Expo. It decides
// nothing about what should be scheduled (see domain/notificationPlanner.ts).
// Each notification's `key`, `kind` and `fireAt` are stored in its
// `content.data`, so what is scheduled can be matched to the plan without
// reading titles or Expo's trigger.

// Returns the identifier Expo gave the notification.
export async function schedule(
  notification: PlannedNotification,
): Promise<string> {
  const { key, kind, title, body, fireAt } = notification;

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: Platform.OS === "ios" ? "default" : undefined,
      data: { key, kind, fireAt: fireAt.toISOString() },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
}

const KINDS: NotificationKind[] = ["saint", "favourite", "calendar"];

const isKind = (value: unknown): value is NotificationKind =>
  KINDS.includes(value as NotificationKind);

const readFireAt = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toScheduled = ({
  identifier,
  content,
}: Notifications.NotificationRequest): ScheduledNotification => {
  const title = content.title ?? "";
  const data = content.data ?? {};
  const { key, kind } = data;

  if (typeof key === "string" && isKind(kind)) {
    return {
      identifier,
      key,
      kind,
      title,
      body: content.body ?? "",
      fireAt: readFireAt(data.fireAt),
    };
  }

  // Scheduled before keys existed; only the saint title is recognisable
  return {
    identifier,
    key: null,
    kind: title === SAINT_NOTIFICATION_TITLE ? "saint" : null,
    title,
    body: content.body ?? "",
    fireAt: null,
  };
};

// Everything Expo has scheduled, which is the only record of what is.
export async function listScheduled(): Promise<ScheduledNotification[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.map(toScheduled);
}

export async function cancel(identifiers: string[]): Promise<void> {
  for (const identifier of identifiers) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }
}
