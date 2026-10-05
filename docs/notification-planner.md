# Notification planner

Design for splitting the old `utils/notifications.ts` (issue #84, deleted in #93). #84 added the pure planner and documented the rest. #85 added the gateway and moved the existing saint, favourite and category scheduling onto it. #86 moved the app-lifecycle notification work to the root layout. #129 wrote the reconcile step for saints (`syncNotifications.ts`); #130 decided against favourite and calendar notifications for now (see "What #130 changed").

## What the app needs

- Saint of the Day notifications.
- A switch to turn them off, which also cancels the ones already scheduled, and back on.
- Later, a switch per calendar for notifications about that calendar's events. The Settings screen already stores an `enabled` flag and a `daysBefore` per calendar.

## Why split

`utils/notifications.ts` reads settings, fetches saints, keeps `notified-*` markers in AsyncStorage, schedules and cancels with Expo, and logs, all in one place. That causes the known bugs:

- Favourite notifications cannot be cancelled: cancelling matches the title `"Favourite Event"`, but they are scheduled with the title `"<event> in 5 days!"`.
- Saint notifications can be skipped after a cold start, because the `notified-*` marker and Expo's schedule can disagree.
- Category scheduling reads a module-level `useState` and is dead code.
- The three notification types use different key formats (`notified-<date>`, `notified-<calendar>-<date>`).

## Three parts

| Part           | Where                                                                                             | Does                                                                                                                                                    | Must not                                               |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Planner        | [notificationPlanner.ts](../src/features/notifications/notificationPlanner.ts)                    | From saints, events, settings and now, returns the notifications that should exist. Also diffs a plan against what is scheduled.                        | Import React, Expo or AsyncStorage, or read the clock. |
| Gateway        | [notificationGateway.ts](../src/features/notifications/notificationGateway.ts)                    | `schedule`, `listScheduled` and `cancel` with Expo. Stores `key`, `kind` and `fireAt` in each notification's data and reads them back when listing.     | Decide what should be scheduled.                       |
| Reconcile step | not written yet                                                                                   | Loads inputs, asks the planner for the plan, lists scheduled notifications, runs `reconcileNotifications` for the kinds that loaded, calls the gateway. | Keep its own record of what was scheduled.             |

Expo's own list of scheduled notifications is the only record of what is scheduled. The `notified-*` markers go away, which fixes the cold-start problem: each reconcile compares against what Expo actually holds.

## Message contract

```ts
type PlannedNotification = {
  key: string; // stable identity, see below
  kind: "saint" | "favourite" | "calendar";
  title: string;
  body: string;
  fireAt: Date; // an instant; the planner computes it in parish time
};
```

Keys:

| Kind     | Key                              | Example                 |
| -------- | -------------------------------- | ----------------------- |
| saint    | `saint:<parish day>`             | `saint:2026-09-30`      |
| calendar | `calendar:<calendar>:<event id>` | `calendar:youth:abc123` |

Key rules:

- A key never contains the title, body or lead time, so changing any of them does not lose track of the notification. Changing `daysBefore` moves `fireAt`, so reconcile cancels and reschedules it.
- A saint key uses the parish day (`parishDayKey`), not the device's day.
- `<calendar>` is the event's `source`, the same name used as the key of the calendar settings.

What the gateway stores and returns:

- When scheduling, the gateway puts `{ key, kind, fireAt }` in the notification's `content.data`.
- When listing, it returns them as `ScheduledNotification.key`, `.kind` and `.fireAt`, with the Expo `identifier` for cancelling.
- It does not work `fireAt` out from Expo's trigger. Expo returns date triggers in more than one shape, and if the time could not be read back exactly every notification would look changed and be rescheduled on every run. A `fireAt` of `null` counts as changed.
- Notifications scheduled before keys existed have no stored data, so they come back with `key: null` and `kind: null`. The gateway may set `kind: "saint"` for ones titled `Saint of the Day`.

Saint notifications:

- One per parish day that has at least one saint.
- Fires at 8:00 parish time (`Australia/Melbourne`), including across daylight saving changes.
- Title `Saint of the Day`, body is the saint names joined with `, `.
- Not planned if 8:00 that day is before `now`.
- Example: saints for the next 7 days produce 7 notifications at 8am.

Calendar notifications:

- One per event on a calendar whose setting is `enabled`, at 9:00 parish time, `daysBefore` days before the event day (default 1).
- Title `<event title> coming up!`, body `Start time: 7:30 pm` in parish time, or `All day`.
- Not planned if that time is before `now`, the start cannot be read, or the calendar is off or has no setting.

Favourite notifications were dropped in #130 (see below). If they come back, key them `favourite:<event id>` so one can be cancelled by event, and decide whether an event that is both a favourite and on an enabled calendar gets one notification or two.

## Limit on scheduled notifications

iOS keeps only the soonest 64 pending local notifications and silently drops the rest. `planNotifications` sorts the combined plan by time and keeps at most `MAX_PLANNED_NOTIFICATIONS` (60). Seven saints are well inside that, but several busy calendars could pass it. The 4 spare slots are room for notifications that are kept while their kind is not being reconciled (see below).

Saints are only planned a week ahead, so they stop if the app is not opened for a week. Looking further ahead, say 14 days, is cheap now that the cap exists, and is worth deciding in the next issue.

## What settingsStore needs to export

[settingsStore.ts](../src/services/settings/settingsStore.ts) holds `startOfWeek` and `themeChoice`. The planner needs the notification settings, which today are only readable through async repository functions (`isDailySaintNotificationsEnabled`, `isFavouriteNotificationsEnabled`, `getCalendarNotificationSettings`). Add:

- `dailySaintsEnabled: boolean`, `favouritesEnabled: boolean` and `calendarNotifications: CalendarNotificationSettings` state, loaded in `hydrate()` through the existing repository functions.
- `setDailySaintsEnabled(value)`, `setFavouritesEnabled(value)` and `setCalendarNotification(calendar, setting)`, which save through the repository and update the state, like the existing setters.

The reconcile step reads these straight from the store as the planner's `NotificationSettings` (`calendarNotifications` is passed as `calendars`). The Settings screen should also read from the store, so a switch and the schedule cannot disagree.

## Reconcile loop

```ts
async function reconcile() {
  const s = useSettingsStore.getState();
  const kinds: NotificationKind[] = [];
  let saints: SaintDay[] = [];
  let events: EventData[] = [];

  // Load only what a switched-on kind needs, so turning notifications off
  // never depends on the network
  if (s.dailySaintsEnabled) {
    try {
      saints = await loadSaintsForNextDays(7); // must throw on failure
      kinds.push("saint");
    } catch {} // leave scheduled saints as they are
  } else {
    kinds.push("saint"); // nothing to plan, so cancel what is scheduled
  }

  // calendar: the same, loading events only if some calendar is enabled
  // favourite: from useFavouritesStore, once the product scope is decided

  const planned = planNotifications({
    saints,
    favourites: Object.values(useFavouritesStore.getState().favourites),
    events,
    settings: {
      dailySaintsEnabled: s.dailySaintsEnabled,
      favouritesEnabled: s.favouritesEnabled,
      calendars: s.calendarNotifications,
    },
    now: now(),
  });

  const scheduled = await gateway.listScheduled();
  const { toCancel, toSchedule } = reconcileNotifications(
    planned,
    scheduled,
    kinds,
  );

  for (const n of toCancel) await gateway.cancel(n.identifier);
  for (const n of toSchedule) await gateway.schedule(n);
}
```

How it meets the requirements:

- **Saints off cancels what is scheduled.** The planner plans no saints, saints are in `kinds`, so reconcile cancels every saint notification, including old ones with no key. Saints back on schedules them again.
- **A calendar off** cancels that calendar's events and leaves the others alone, because only its plan entries disappear. Changing `daysBefore` reschedules.
- **Old notifications are cleaned up.** Anything scheduled before keys existed has no key, so it is cancelled rather than left to be duplicated by a keyed copy.
- **A failed load does not cancel the week.** `calendarService.getSaintsForDate` catches errors and returns `[]` ([GoogleCalendarService.ts](../src/features/calendar/services/GoogleCalendarService.ts)), which is indistinguishable from a day with no saints. The loader the reconcile step uses must throw instead, and a kind whose load failed is left out of `kinds`, so reconcile does not touch it.

Rules for the reconcile step:

- **One run at a time.** Home schedules on mount and a Settings switch will trigger a run too. Two overlapping runs can both see nothing scheduled and both schedule. Keep one run going and, if another is requested meanwhile, run once more when it finishes.
- It is safe to run as often as needed: when nothing changed, `toCancel` and `toSchedule` are empty.
- Cancel before schedule, so a changed notification is replaced rather than duplicated.
- Where it runs (root layout, app foreground, after a settings change) is the next issue.

## Out of scope here

- Changing the Settings screen.
- Writing the reconcile step or the settingsStore changes.
- Deciding favourite notifications.

## What #85 changed

- [notificationGateway.ts](../src/features/notifications/notificationGateway.ts) is the only code that calls Expo to schedule, list or cancel. `listScheduled` returns `key: null` for anything without usable stored data, and `kind: "saint"` for an old "Saint of the Day" notification.
- `saintNotifications.ts` (deleted in #129) plans the next 7 days with `planSaintNotifications` and schedules only the parish days Expo does not already hold. It does not cancel a saint that is no longer planned: `getSaintsForDate` returns `[]` on a failed fetch, so cancelling would drop the week. A saint notification with no key (scheduled before this change) is cancelled and replaced. `cancelAllSaintNotifications` cancels by kind.
- `favouriteNotifications.ts` (deleted in #130) keeps the existing timing and text, keys each notification `favourite:<event id>`, and cancels by kind. This fixes the title mismatch that made favourites impossible to cancel.
- The old category scheduling (`calendarNotifications.ts`) was deleted in #94. It read `events-<calendar>` keys that nothing ever wrote, so it never ran. The planner's calendar plan (`calendarNotificationKey`) is its replacement.
- No code reads or writes `notified-*` in AsyncStorage any more. Markers left on devices by older versions are harmless and are not cleaned up.
- `utils/notifications.ts` re-exported these at the time, so the Settings screen and Home hook were unchanged. #93 deleted it.

## What #86 changed

- [app/_layout.tsx](../src/app/_layout.tsx) now does the app-lifecycle work once on mount: `setupNotificationHandler()`, `requestNotificationPermissions()`, `setupNotificationListeners()` (its cleanup runs on unmount) and `scheduleSaintNotificationsForNext7Days()`. It no longer depends on Home being rendered first.
- `notifications.tsx` (now `appNotifications.ts`) no longer sets the handler as an import side effect; `setupNotificationHandler()` does it when called.
- [useHomeFeature.ts](../src/features/calendar/hooks/useHomeFeature.ts) keeps only the Home data and its background refresh.
- What is scheduled is unchanged. The initial run is still `scheduleSaintNotificationsForNext7Days()`, not the planner's reconcile step, which is still unwritten.
- `utils/notifications.ts` called `useState` at module level, which logged "Invalid hook call" when imported. #93 deleted it and the Settings screen now imports from `@/features/notifications`.

## What #129 changed

- [syncNotifications.ts](../src/features/notifications/syncNotifications.ts) is the reconcile step, for saints only. It loads the next 7 days of saints, runs `planNotifications`, lists what Expo holds and applies `reconcileNotifications`, cancelling before scheduling. It never rejects.
- Saints load through `calendarService.getSaintsForDateOrThrow`, which rejects on a failed request (`getSaintsForDate` still returns `[]`). If any day fails, `saint` is left out of `kinds` and the existing schedule is untouched. With saints switched off, `saint` is in `kinds` and nothing is loaded, so every saint notification is cancelled (including old ones with no key) without the network.
- One run at a time: a call made during a run sets a flag, and the run goes round once more when it finishes, however many calls arrived.
- It runs from the root layout once settings have hydrated (the store's defaults have saints on, so running earlier could schedule what the user switched off) and after the Settings saint toggle.
- `saintNotifications.ts` (`scheduleSaintNotificationsForNext7Days`, `cancelAllSaintNotifications`) is deleted.
- Not done: favourite and calendar kinds (#130), and running again on app foreground.

## What #130 changed

Decision: favourite and calendar notifications are not offered until the product wants them (option a of #130). Nothing was built on the planner for them.

- Deleted `favouriteNotifications.ts` and its tests, and the stub `planFavouriteNotifications`. `NotificationPlanInput` lost `favourites` and `NotificationSettings` lost `favouritesEnabled`.
- Removed the hidden favourites and per-calendar blocks from the Settings screen, and the favourites flag (`favouritesEnabled`, `setFavouritesEnabled`, and the repository's `isFavouriteNotificationsEnabled` and `saveFavouriteNotificationsEnabled`). The stored `favouriteNotificationsEnabled` value on a device is left alone and is never read.
- `calendarNotifications.ts` was already gone (#94). No `AsyncStorage` import remains under `src/features/notifications/`.
- Kept for later: `planCalendarNotifications` (tested, but nothing supplies events yet), the calendar notification settings in the store and repository (`syncNotifications` still passes them to the planner), and the `"favourite"` and `"calendar"` values of `NotificationKind`.
- To bring either kind back: load its inputs in `syncNotifications`, add the kind to `kinds`, and unhide a Settings control. That ties in with #54, #13 and #16.
