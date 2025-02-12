import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Request permission for notifications
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Schedule a local notification
export async function scheduleNotification(title: string, body: string, date: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: Platform.OS === 'ios' ? 'default' : undefined,
    },
    trigger: { date },
  });
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Handle notification interactions
export function setupNotificationListeners() {
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification Received:', notification);
  });

  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification Clicked:', response);
  });
}