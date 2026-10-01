import { atParishHour, now } from "@/domain/parishTime";
import { scheduleNotification } from "@/notifications";
import type { EventData } from "@/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useState } from "react";

// Calendar states
export const [calendarSettings, setCalendarSettings] = useState<{
  [key: string]: { enabled: boolean; daysBefore: number };
}>({});

export {
  cancelAllFavouriteNotifications,
  cancelAllSaintNotifications,
  scheduleFavouriteNotifications,
  scheduleSaintNotificationsForNext7Days,
} from "@/services/notifications";

export async function scheduleCategoryNotifications(calendar: string) {
  const setting = calendarSettings[calendar];

  if (!setting?.enabled) {
    console.log(`Notifications for ${calendar} are disabled.`);
    return;
  }

  // Retrieve events for this calendar (replace with your actual events source)
  const storedEventsStr = await AsyncStorage.getItem(`events-${calendar}`);
  if (!storedEventsStr) {
    console.log(`No events found for calendar: ${calendar}`);
    return;
  }

  let events: any[] = [];
  try {
    events = JSON.parse(storedEventsStr);
  } catch (e) {
    console.error(`Failed to parse events for ${calendar}:`, e);
    return;
  }

  for (const event of events) {
    const title = event.title;
    const dateStr = event.start;
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      console.warn(`Invalid date for event: ${title}`);
      continue;
    }

    // Calculate notification time based on daysBefore
    const daysBefore = setting.daysBefore ?? 1;
    const notifyDate = atParishHour(date, 9, -daysBefore); // notify at 9 AM

    if (notifyDate < now()) {
      console.log(
        `Skipping ${title} — notification time in the past: ${notifyDate}`,
      );
      continue;
    }

    // Check if already scheduled (optional)
    const key = `notified-${calendar}-${date.toDateString()}`;
    const alreadyScheduled = await AsyncStorage.getItem(key);
    if (alreadyScheduled) {
      console.log(`[${calendar}] ${title} already scheduled.`);
      continue;
    }

    // Schedule notification
    await scheduleNotification(
      `${title} coming up!`,
      `Start time: ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      notifyDate,
    );

    // Mark as scheduled
    await AsyncStorage.setItem(key, "true");
    console.log(`Scheduled ${title} for ${notifyDate}`);
  }
}
