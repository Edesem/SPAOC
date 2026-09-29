import { atParishHour, now } from "@/domain/parishTime";
import { scheduleNotification } from "@/notifications";
import { calendarService } from "@/services/calendar";
import { getFavourites } from "@/services/favourites";
import {
  isDailySaintNotificationsEnabled,
  isFavouriteNotificationsEnabled,
} from "@/services/settings";
import type { EventData } from "@/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useState } from "react";

// Calendar states
export const [calendarSettings, setCalendarSettings] = useState<{
  [key: string]: { enabled: boolean; daysBefore: number };
}>({});

export async function scheduleSaintNotificationsForNext7Days() {
  if (!(await isDailySaintNotificationsEnabled())) {
    console.log("Daily saint notifications are disabled.");
    return;
  }

  for (let i = 0; i < 7; i++) {
    // Midday on the i-th parish day from today; any instant in the day works
    // for the saints lookup and for the day's dedupe key
    const date = atParishHour(now(), 12, i);
    const dateKey = date.toDateString();

    const saints = await calendarService.getSaintsForDate(date);

    if (saints.length === 0) continue;

    const saintText = saints.join(", ");

    const alreadyScheduled = await AsyncStorage.getItem(`notified-${dateKey}`);
    console.log(
      `[Day ${i}] ${date.toDateString()} - ${saintText} - Already scheduled: ${
        alreadyScheduled ? "✅ Yes" : "❌ No"
      }`,
    );
    if (alreadyScheduled) continue;

    const notificationTime = atParishHour(date, 8); // 8AM each day

    if (notificationTime < now()) {
      console.log(`[${i}] ${dateKey} - Skipping, time is in the past`);
      continue;
    }

    await scheduleNotification(
      "Saint of the Day",
      `${saintText}`,
      notificationTime,
    );

    await AsyncStorage.setItem(`notified-${dateKey}`, "true");
  }

  const all = await Notifications.getAllScheduledNotificationsAsync();

  console.log("Scheduled notifications:");
  all.forEach((notif) => {
    const title = notif.content.title;
    const body = notif.content.body;
    let date = "-";

    // If trigger has a date/time
    const trigger = notif.trigger;
    if (trigger && "seconds" in trigger && trigger.seconds) {
      date = new Date(Date.now() + trigger.seconds * 1000).toLocaleString();
    } else if (
      trigger &&
      "hour" in trigger &&
      "minute" in trigger &&
      trigger.hour !== undefined &&
      trigger.minute !== undefined
    ) {
      const now = new Date();
      date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        trigger.hour,
        trigger.minute,
      ).toLocaleString();
    }

    console.log(`- ${title} | ${body} | ${date}`);
  });
}

export async function cancelAllSaintNotifications() {
  const all = await Notifications.getAllScheduledNotificationsAsync();

  /*
  await scheduleNotification(
    "Saint of the Day",
    "Test Saint",
    new Date(Date.now() + 1 * 60 * 1000) // 1 min from now
  );

  console.log("Scheduled notifications:");
  all.forEach((notif) => {
    const title = notif.content.title;
    const body = notif.content.body;
    let date = "-";

    // If trigger has a date/time
    if (notif.trigger?.seconds) {
      date = new Date(
        Date.now() + notif.trigger.seconds * 1000
      ).toLocaleString();
    } else if (
      notif.trigger?.hour !== undefined &&
      notif.trigger?.minute !== undefined
    ) {
      const now = new Date();
      date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        notif.trigger.hour,
        notif.trigger.minute
      ).toLocaleString();
    }

    console.log(`- ${title} | ${body} | ${date}`);
  });
  */

  for (const notif of all) {
    if (notif.content.title === "Saint of the Day") {
      console.log(notif.content);
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  // Remove all AsyncStorage keys related  to saint notifications
  const keys = await AsyncStorage.getAllKeys();
  const saintKeys = keys.filter((k) => k.startsWith("notified-"));
  for (const key of saintKeys) {
    await AsyncStorage.removeItem(key);
    console.log(`Removed AsyncStorage key: ${key}`);
  }
}

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
