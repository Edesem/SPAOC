import { scheduleNotification } from "@/notifications";
import { AsyncStorage } from "react-native";

export async function scheduleSaintNotificationIfNeeded(saints: string[]) {
  const lastDate = await AsyncStorage.getItem('lastSaintNotificationDate');
  const today = new Date().toDateString();

  if (lastDate === today) return; // Already notified today

  const saintText = saints.join(', ');
  const scheduleTime = new Date();
  scheduleTime.setHours(7, 0, 0, 0); // 7 AM

  // Schedule notification
  await scheduleNotification("Saint of the Day", `Today we commemorate: ${saintText}`, scheduleTime);
  await AsyncStorage.setItem('lastSaintNotificationDate', today);
}