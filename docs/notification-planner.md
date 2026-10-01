# Notification planner

Design for splitting [utils/notifications.ts](../utils/notifications.ts) (issue #84). This step adds the pure planner and documents the rest. `utils/notifications.ts` is unchanged and nothing calls the planner yet.

## Why split

`utils/notifications.ts` reads settings, fetches saints, keeps `notified-*` markers in AsyncStorage, schedules and cancels with Expo, and logs, all in one place. That causes the known bugs:

- Favourite notifications cannot be cancelled: cancelling matches the title `"Favourite Event"`, but they are scheduled with the title `"<event> in 5 days!"`.
- Saint notifications can be skipped after a cold start, because the `notified-*` marker and Expo's schedule can disagree.
- Category scheduling reads a module-level `useState` and is dead code.
- The three notification types use different key formats (`notified-<date>`, `notified-<calendar>-<date>`).

## Three parts

| Part           | Where                                                             | Does                                                                                                                                 | Must not                                               |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Planner        | [domain/notificationPlanner.ts](../domain/notificationPlanner.ts) | From saints, favourites, settings and now, returns the notifications that should exist. Also diffs a plan against what is scheduled. | Import React, Expo or AsyncStorage, or read the clock. |
| Gateway        | not written yet, wraps [notifications.tsx](../notifications.tsx)  | Schedules, lists and cancels with Expo. Stores the plan key on each notification and reads it back when listing.                     | Decide what should be scheduled.                       |
| Reconcile step | not written yet                                                   | Loads inputs, asks the planner for the plan, lists scheduled notifications, runs `reconcileNotifications`, calls the gateway.        | Keep its own record of what was scheduled.             |

Expo's own list of scheduled notifications is the only record of what is scheduled. The `notified-*` markers go away, which fixes the cold-start problem: each reconcile compares against what Expo actually holds.

## Message contract

```ts
type PlannedNotification = {
  key: string; // stable identity, see below
  kind: "saint" | "favourite";
  title: string;
  body: string;
  fireAt: Date; // an instant; the planner computes it in parish time
};
```

Keys:

| Kind                 | Key                    | Example            |
| -------------------- | ---------------------- | ------------------ |
| saint                | `saint:<parish day>`   | `saint:2026-09-30` |
| favourite (proposed) | `favourite:<event id>` | `favourite:abc123` |

Key rules:

- A key never contains the title or body, so changing the text does not lose track of the notification.
- A saint key uses the parish day (`parishDayKey`), not the device's day.
- The gateway stores the key in the notification's `content.data.key` and returns it as `ScheduledNotification.key`. Anything scheduled without a key is not ours and reconcile leaves it alone.

Saint notifications:

- One per parish day that has at least one saint.
- Fires at 8:00 parish time (`Australia/Melbourne`), including across daylight saving changes.
- Title `Saint of the Day`, body is the saint names joined with `, `.
- Not planned if 8:00 that day is before `now`.
- Example: saints for the next 7 days produce 7 notifications at 8am.

Favourite notifications are a TODO. `planFavouriteNotifications` returns `[]` until the product scope is decided. When it is, the key above lets a favourite be cancelled by event.

## What settingsStore needs to export

[settingsStore.ts](../services/settings/settingsStore.ts) holds `startOfWeek` and `themeChoice`. The planner needs the two notification toggles, which today are only readable through async repository functions (`isDailySaintNotificationsEnabled`, `isFavouriteNotificationsEnabled`). Add:

- `dailySaintsEnabled: boolean` and `favouritesEnabled: boolean` state, loaded in `hydrate()` through the existing repository functions.
- `setDailySaintsEnabled(value)` and `setFavouritesEnabled(value)`, which save through the repository and update the state, like the existing setters.

The reconcile step then reads `{ dailySaintsEnabled, favouritesEnabled }` straight from the store as the planner's `NotificationSettings`. The per-calendar `calendarNotificationSettings` stay out until category notifications are in scope.

## Reconcile loop

```ts
async function reconcile() {
  const { dailySaintsEnabled, favouritesEnabled } = useSettingsStore.getState();

  const planned = planNotifications({
    saints: await loadSaintsForNextDays(7), // calendarService.getSaintsForDate per day
    favourites: Object.values(useFavouritesStore.getState().favourites),
    settings: { dailySaintsEnabled, favouritesEnabled },
    now: now(),
  });

  const scheduled = await gateway.listScheduled();
  const { toCancel, toSchedule } = reconcileNotifications(planned, scheduled);

  for (const n of toCancel) await gateway.cancel(n.identifier);
  for (const n of toSchedule) await gateway.schedule(n);
}
```

Notes:

- It is safe to run at any time and as often as needed: when nothing changed, `toCancel` and `toSchedule` are empty.
- Turning a setting off needs no separate cancel function. The planner plans nothing for that kind, so reconcile cancels what is scheduled.
- Cancel before schedule, so a changed notification is replaced rather than duplicated.
- Where it runs (root layout, app foreground, after a settings change) is the next issue.

## Out of scope here

- Changing `utils/notifications.ts` or the Settings screen.
- Moving app-lifecycle work to the root layout.
- Favourite and category notifications.
