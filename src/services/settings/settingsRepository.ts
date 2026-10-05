import AsyncStorage from "@react-native-async-storage/async-storage";

import { CALENDAR_SOURCE_NAMES } from "@/domain/calendarSources";

// App settings and notification preferences are persisted in AsyncStorage
// exactly as the app has always stored them: flags as the strings
// "true"/"false", the start of week and theme as plain strings, and calendar
// notification settings as a JSON object keyed by calendar name. This module
// is the only place that knows about those keys and formats.
const START_OF_WEEK_KEY = "START_OF_WEEK";
const THEME_KEY = "APP_THEME";
const DAILY_SAINTS_NOTIFICATIONS_KEY = "dailySaintsNotificationsEnabled";
const CALENDAR_NOTIFICATIONS_KEY = "calendarNotificationSettings";

export type StartOfWeek = "sunday" | "monday";
export type ThemeChoice = "light" | "dark" | "auto";

export interface CalendarNotificationSetting {
  enabled: boolean;
  daysBefore: number;
}

export type CalendarNotificationSettings = Record<
  string,
  CalendarNotificationSetting
>;

const writeFlag = (key: string, enabled: boolean) =>
  AsyncStorage.setItem(key, enabled.toString());

// Start of week

// Resolves to null when nothing (or an unrecognised value) is stored, so the
// caller keeps its own default.
export async function getStartOfWeek(): Promise<StartOfWeek | null> {
  const stored = await AsyncStorage.getItem(START_OF_WEEK_KEY);
  return stored === "sunday" || stored === "monday" ? stored : null;
}

export async function saveStartOfWeek(value: StartOfWeek): Promise<void> {
  await AsyncStorage.setItem(START_OF_WEEK_KEY, value);
}

// Theme

// "auto" (follow the system) when nothing or an unrecognised value is stored.
export async function getThemeChoice(): Promise<ThemeChoice> {
  const stored = await AsyncStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "auto";
}

export async function saveThemeChoice(choice: ThemeChoice): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, choice);
}

// Notification toggles

// Both toggles are on unless explicitly stored as "false", so a fresh install
// treats notifications exactly as the Settings switch shows them.
export async function isDailySaintNotificationsEnabled(): Promise<boolean> {
  return (
    (await AsyncStorage.getItem(DAILY_SAINTS_NOTIFICATIONS_KEY)) !== "false"
  );
}

export async function saveDailySaintNotificationsEnabled(
  enabled: boolean,
): Promise<void> {
  await writeFlag(DAILY_SAINTS_NOTIFICATIONS_KEY, enabled);
}

// Calendar notification settings

// Returns the saved settings, or saves and returns a disabled, one-day-before
// entry for each registered calendar when none have been saved. Throws if the
// stored value is not valid JSON, so callers can decide how to report it.
export async function getCalendarNotificationSettings(): Promise<CalendarNotificationSettings> {
  const stored = await AsyncStorage.getItem(CALENDAR_NOTIFICATIONS_KEY);
  if (stored) return JSON.parse(stored);

  const defaults: CalendarNotificationSettings = Object.fromEntries(
    CALENDAR_SOURCE_NAMES.map((name) => [
      name,
      { enabled: false, daysBefore: 1 },
    ]),
  );
  await saveCalendarNotificationSettings(defaults);
  return defaults;
}

export async function saveCalendarNotificationSettings(
  settings: CalendarNotificationSettings,
): Promise<void> {
  await AsyncStorage.setItem(
    CALENDAR_NOTIFICATIONS_KEY,
    JSON.stringify(settings),
  );
}
