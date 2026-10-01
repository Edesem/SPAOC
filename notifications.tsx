import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Decides how a notification is presented while the app is open. Called once
// from the root layout so it is installed whichever screen opens first.
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // 👈 Show alert even when app is in foreground
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

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

// Handle notification interactions. Returns a function that removes the
// listeners again.
export function setupNotificationListeners() {
  const received = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification Received:", notification);
    },
  );

  const response = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("Notification Clicked:", response);
    },
  );

  return () => {
    received.remove();
    response.remove();
  };
}
