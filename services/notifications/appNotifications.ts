import * as Notifications from "expo-notifications";

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
