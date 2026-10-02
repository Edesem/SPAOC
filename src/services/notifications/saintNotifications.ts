import { planSaintNotifications } from "@/domain/notificationPlanner";
import { atParishHour, now } from "@/lib/parishTime";
import { calendarService } from "@/services/calendar";
import { isDailySaintNotificationsEnabled } from "@/services/settings";

import { cancel, listScheduled, schedule } from "./notificationGateway";

const SAINT_DAYS_AHEAD = 7;

// Keeps the next week of Saint of the Day notifications scheduled. A day that
// is already scheduled is left alone, so this is safe to call on every launch.
// Expo's own list is the record of what is scheduled; nothing is kept in
// AsyncStorage.
export async function scheduleSaintNotificationsForNext7Days() {
  if (!(await isDailySaintNotificationsEnabled())) {
    console.log("Daily saint notifications are disabled.");
    return;
  }

  const current = now();
  const saints = [];
  for (let i = 0; i < SAINT_DAYS_AHEAD; i++) {
    // Midday on the i-th parish day from today; any instant in the day works
    const date = atParishHour(current, 12, i);
    saints.push({ date, names: await calendarService.getSaintsForDate(date) });
  }

  const scheduled = (await listScheduled()).filter((n) => n.kind === "saint");

  // From before notifications carried a key; a keyed copy would duplicate them
  await cancel(
    scheduled.filter((n) => n.key === null).map((n) => n.identifier),
  );

  const alreadyScheduled = new Set(scheduled.map((n) => n.key));
  for (const notification of planSaintNotifications(saints, current)) {
    if (alreadyScheduled.has(notification.key)) continue;
    await schedule(notification);
  }
}

export async function cancelAllSaintNotifications() {
  const scheduled = await listScheduled();
  await cancel(
    scheduled.filter((n) => n.kind === "saint").map((n) => n.identifier),
  );
}
