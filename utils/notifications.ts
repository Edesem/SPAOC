import {
  DAILY_SAINTS_NOTIFICATIONS_ENABLED,
  FAVOURITES_KEY,
  FAVOURITES_NOTIFICATIONS_ENABLED,
} from "@/constants/consts";
import { fetchSaintsForDate, useDailySaint } from "@/hooks/useDailySaint";
import { scheduleNotification } from "@/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export async function scheduleSaintNotificationsForNext7Days() {
  const isEnabled = await AsyncStorage.getItem(
    DAILY_SAINTS_NOTIFICATIONS_ENABLED
  );
  if (isEnabled !== "true") {
    console.log("Daily saint notifications are disabled.");
    return;
  }

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateKey = date.toDateString();

    const saints = await fetchSaintsForDate(date);

    if (saints.length === 0) continue;

    const saintText = saints.join(", ");

    const alreadyScheduled = await AsyncStorage.getItem(`notified-${dateKey}`);
    console.log(
      `[Day ${i}] ${date.toDateString()} - ${saintText} - Already scheduled: ${
        alreadyScheduled ? "✅ Yes" : "❌ No"
      }`
    );
    if (alreadyScheduled) continue;

    const notificationTime = new Date(date);
    notificationTime.setHours(8, 0, 0, 0); // 8AM each day

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

  const all = await Notifications.getAllScheduledNotificationsAsync();

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
  const isEnabled = await AsyncStorage.getItem(
    FAVOURITES_NOTIFICATIONS_ENABLED
  );

  if (isEnabled !== "true") {
    console.log("Favourite event notifications are disabled.");
    return;
  }

  const storedFavourites = await AsyncStorage.getItem(FAVOURITES_KEY);

  if (!storedFavourites) {
    console.log("No favourites found.");
    return;
  }

  let favourites: Record<string, any> = {};
  try {
    favourites = JSON.parse(storedFavourites);
  } catch (e) {
    console.error("Failed to parse favourites:", e);
    return;
  }

  const entries = Object.entries(favourites);

  for (let i = 0; i < entries.length; i++) {
    const [_, fav] = entries[i];
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

    const weekBefore = new Date(date);
    weekBefore.setDate(date.getDate() - 5);
    weekBefore.setHours(9, 0, 0, 0);

    if (weekBefore < new Date()) {
      console.log(
        `Skipping [${title}] — weekBefore is in the past: ${weekBefore}`
      );
      continue;
    }

    const fiveSecondsLater = new Date(Date.now() + 5000);

    console.log(`Scheduling... [${title}] @ ${weekBefore}`);
    await scheduleNotification(
      `${title} in 5 days!`,
      `Start time is ${timeOnly}`,
      weekBefore
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
