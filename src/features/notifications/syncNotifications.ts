import { calendarService } from "@/features/calendar";
import { atParishHour, now } from "@/lib/parishTime";
import { useSettingsStore } from "@/services/settings";

import { cancel, listScheduled, schedule } from "./notificationGateway";
import {
  planNotifications,
  reconcileNotifications,
  type NotificationKind,
  type SaintDay,
} from "./notificationPlanner";

export const SAINT_DAYS_AHEAD = 7;

// Rejects if any day cannot be loaded: a partial week would look like days with
// no saints, and reconciling against it would cancel their notifications.
const loadSaints = (current: Date): Promise<SaintDay[]> =>
  Promise.all(
    Array.from({ length: SAINT_DAYS_AHEAD }, async (_, i) => {
      // Midday on the i-th parish day from today; any instant in the day works
      const date = atParishHour(current, 12, i);
      return {
        date,
        names: await calendarService.getSaintsForDateOrThrow(date),
      };
    }),
  );

// Makes what Expo has scheduled match what should be scheduled. Only kinds
// whose inputs loaded are touched, so a failed load never cancels anything.
async function runOnce(): Promise<void> {
  const settings = useSettingsStore.getState();
  const current = now();
  const kinds: NotificationKind[] = [];
  let saints: SaintDay[] = [];

  if (settings.dailySaintsEnabled) {
    try {
      saints = await loadSaints(current);
      kinds.push("saint");
    } catch (error) {
      console.error("Could not load saints; keeping scheduled ones", error);
    }
  } else {
    // Nothing to plan, so cancel any that are scheduled, without the network
    kinds.push("saint");
  }

  const planned = planNotifications({
    saints,
    events: [],
    settings: {
      dailySaintsEnabled: settings.dailySaintsEnabled,
      calendars: settings.calendarNotifications,
    },
    now: current,
  });

  const { toCancel, toSchedule } = reconcileNotifications(
    planned,
    await listScheduled(),
    kinds,
  );

  // Cancel first so a changed notification is replaced, not duplicated
  await cancel(toCancel.map((n) => n.identifier));
  for (const notification of toSchedule) {
    await schedule(notification);
  }
}

let running: Promise<void> | null = null;
let runAgain = false;

// Safe to call whenever something that affects notifications may have changed
// (startup, a Settings switch); when nothing has, it changes nothing. Only one
// run happens at a time, since two overlapping runs could both see nothing
// scheduled and both schedule. A call made during a run does not start another
// alongside it: the run goes round once more when it finishes, however many
// calls were made. The returned promise settles when that is done, and never
// rejects.
export function syncNotifications(): Promise<void> {
  if (running) {
    runAgain = true;
    return running;
  }

  running = (async () => {
    try {
      do {
        runAgain = false;
        try {
          await runOnce();
        } catch (error) {
          console.error("Could not sync notifications", error);
        }
      } while (runAgain);
    } finally {
      running = null;
    }
  })();

  return running;
}
