import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // 👈 Show alert even when app is in foreground
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permission for notifications
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Schedule a local notification
export async function scheduleNotification(
  title: string,
  body: string,
  date: Date,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: Platform.OS === "ios" ? "default" : undefined,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE, // Explicitly define type
      date, // Pass the date object
    },
  });
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Handle notification interactions
export function setupNotificationListeners() {
  Notifications.addNotificationReceivedListener((notification) => {
    console.log("Notification Received:", notification);
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("Notification Clicked:", response);
  });
}
