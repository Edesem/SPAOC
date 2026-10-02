import { atParishHour, now } from "@/lib/parishTime";
import { getFavourites } from "@/services/favourites";
import { isFavouriteNotificationsEnabled } from "@/services/settings";
import type { EventData } from "@/types/global";

import { cancel, listScheduled, schedule } from "./notificationGateway";

const FAVOURITE_NOTIFICATION_HOUR = 9;
const FAVOURITE_DAYS_BEFORE = 5;

// Keyed by the event, so a favourite can be cancelled without matching titles
const favouriteNotificationKey = (event: EventData) => `favourite:${event.id}`;

// What notifies for favourites, and how far ahead, is still a product
// decision (see domain/notificationPlanner.ts), so this keeps the existing
// behaviour: 9am parish time five days before the event.
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

  const alreadyScheduled = new Set(
    (await listScheduled())
      .filter((n) => n.kind === "favourite")
      .map((n) => n.key),
  );

  for (const fav of favourites) {
    const date = new Date(fav.start);

    if (isNaN(date.getTime())) {
      console.warn(`Invalid date in favourites: ${fav.start}`);
      continue;
    }

    const key = favouriteNotificationKey(fav);
    if (alreadyScheduled.has(key)) continue;

    const fireAt = atParishHour(
      date,
      FAVOURITE_NOTIFICATION_HOUR,
      -FAVOURITE_DAYS_BEFORE,
    );
    if (fireAt < now()) continue;

    const timeOnly = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    await schedule({
      key,
      kind: "favourite",
      title: `${fav.title} in ${FAVOURITE_DAYS_BEFORE} days!`,
      body: `Start time is ${timeOnly}`,
      fireAt,
    });
  }
}

export async function cancelAllFavouriteNotifications() {
  const scheduled = await listScheduled();
  await cancel(
    scheduled.filter((n) => n.kind === "favourite").map((n) => n.identifier),
  );
}
