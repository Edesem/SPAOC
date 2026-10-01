import { atParishHour, now } from "@/domain/parishTime";
import { scheduleNotification } from "@/notifications";
import { getFavourites } from "@/services/favourites";
import { isFavouriteNotificationsEnabled } from "@/services/settings";
import type { EventData } from "@/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useState } from "react";

// Calendar states
export const [calendarSettings, setCalendarSettings] = useState<{
  [key: string]: { enabled: boolean; daysBefore: number };
}>({});

export {
  cancelAllSaintNotifications,
  scheduleSaintNotificationsForNext7Days,
} from "@/services/notifications";

export async function scheduleFavouriteNotifications() {
  if (!(await isFavouriteNotificationsEnabled())) {
    console.log("Favourite event notifications are disabled.");
    return;
  }

  let favourites: EventData[];
  try {
    favourites = await getFavourites();
  } catch (e) {
    console.error("Failed to parse favourites:", e);
    return;
  }

  if (favourites.length === 0) {
    console.log("No favourites found.");
    return;
  }

  for (const fav of favourites) {
    const title = fav.title;
    const dateStr = fav.start;
    const date = new Date(dateStr);

    const timeOnly = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Use false for 24-hour format
    });

    if (isNaN(date.getTime())) {
      console.warn(`Invalid date in favourites: ${dateStr}`);
      continue;
    }

    const weekBefore = atParishHour(date, 9, -5);

    if (weekBefore < now()) {
      console.log(
        `Skipping [${title}] — weekBefore is in the past: ${weekBefore}`,
      );
      continue;
    }

    console.log(`Scheduling... [${title}] @ ${weekBefore}`);
    await scheduleNotification(
      `${title} in 5 days!`,
      `Start time is ${timeOnly}`,
      weekBefore,
    );
    await AsyncStorage.setItem(`notified-${date}`, "true");
  }
}

export async function cancelAllFavouriteNotifications() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of all) {
    if (notif.content.title === "Favourite Event") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

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
