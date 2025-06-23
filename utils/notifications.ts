import { fetchSaintsForDate, useDailySaint } from "@/hooks/useDailySaint";
import { scheduleNotification } from "@/notifications";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export async function scheduleSaintNotificationsForNext7Days() {
  const isEnabled = await AsyncStorage.getItem('dailySaintsEnabled');
  if (isEnabled !== 'true') {
    console.log('Daily saint notifications are disabled.');
    return;
  }
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateKey = date.toDateString();

    const saints = await fetchSaintsForDate(date);

    if (saints.length === 0) continue;

    const saintText = saints.join(', ');

    const alreadyScheduled = await AsyncStorage.getItem(`notified-${dateKey}`);
    console.log(`[Day ${i}] ${date.toDateString()} - ${saintText} - Already scheduled: ${alreadyScheduled ? "✅ Yes" : "❌ No"}`);
    if (alreadyScheduled) continue;



    const notificationTime = new Date(date);
    notificationTime.setHours(8, 0, 0, 0); // 7AM each day

    if (notificationTime < new Date()) {
      console.log(`[${i}] ${dateKey} - Skipping, time is in the past`);
      continue;
    }

    await scheduleNotification(
      "Saint of the Day",
      `${saintText}`,
      notificationTime
    );

    await AsyncStorage.setItem(`notified-${dateKey}`, "true");
  }
}

export async function cancelAllSaintNotifications() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of all) {
    if (notif.content.title === 'Saint of the Day') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}
