import { calendarNotificationKey } from "@/domain/notificationPlanner";
import { atParishHour, now } from "@/domain/parishTime";
import type { EventData } from "@/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { listScheduled, schedule } from "./notificationGateway";

type CalendarSetting = { enabled: boolean; daysBefore: number };

const CALENDAR_NOTIFICATION_HOUR = 9;

// Not wired to anything yet: nothing writes the `events-<calendar>` events
// this reads, and the planner's calendar plan will replace it. It keeps the
// existing behaviour, with each notification keyed calendar:<calendar>:<id>
// and dedupe against what Expo holds instead of notified-* markers.
export async function scheduleCategoryNotifications(
  calendar: string,
  setting: CalendarSetting | undefined,
) {
  if (!setting?.enabled) {
    console.log(`Notifications for ${calendar} are disabled.`);
    return;
  }

  const storedEventsStr = await AsyncStorage.getItem(`events-${calendar}`);
  if (!storedEventsStr) {
    console.log(`No events found for calendar: ${calendar}`);
    return;
  }

  let events: EventData[];
  try {
    events = JSON.parse(storedEventsStr);
  } catch (e) {
    console.error(`Failed to parse events for ${calendar}:`, e);
    return;
  }

  const alreadyScheduled = new Set(
    (await listScheduled())
      .filter((n) => n.kind === "calendar")
      .map((n) => n.key),
  );

  for (const event of events) {
    const date = new Date(event.start);

    if (isNaN(date.getTime())) {
      console.warn(`Invalid date for event: ${event.title}`);
      continue;
    }

    const key = calendarNotificationKey({ ...event, source: calendar });
    if (alreadyScheduled.has(key)) {
      console.log(`[${calendar}] ${event.title} already scheduled.`);
      continue;
    }

    const fireAt = atParishHour(
      date,
      CALENDAR_NOTIFICATION_HOUR,
      -(setting.daysBefore ?? 1),
    );
    if (fireAt < now()) {
      console.log(
        `Skipping ${event.title} — notification time in the past: ${fireAt}`,
      );
      continue;
    }

    await schedule({
      key,
      kind: "calendar",
      title: `${event.title} coming up!`,
      body: `Start time: ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      fireAt,
    });
  }
}
