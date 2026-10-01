import type { PlannedNotification } from "@/domain/notificationPlanner";
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
