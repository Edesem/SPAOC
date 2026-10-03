import { create } from "zustand";

import {
  getCalendarNotificationSettings,
  getStartOfWeek,
  getThemeChoice,
  isDailySaintNotificationsEnabled,
  isFavouriteNotificationsEnabled,
  saveCalendarNotificationSettings,
  saveDailySaintNotificationsEnabled,
  saveFavouriteNotificationsEnabled,
  saveStartOfWeek,
  saveThemeChoice,
  type CalendarNotificationSetting,
  type CalendarNotificationSettings,
  type StartOfWeek,
  type ThemeChoice,
} from "./settingsRepository";

// Application-wide settings state. The repository stays the only code that
// touches AsyncStorage; this store keeps the current values in memory so any
// screen or hook can read them synchronously. Call hydrate() once at app
// startup to load the persisted values.
interface SettingsState {
  startOfWeek: StartOfWeek;
  themeChoice: ThemeChoice;
  dailySaintsEnabled: boolean;
  favouritesEnabled: boolean;
  calendarNotifications: CalendarNotificationSettings;
  hydrated: boolean;
  getStartOfWeek: () => StartOfWeek;
  setStartOfWeek: (value: StartOfWeek) => void;
  setThemeChoice: (value: ThemeChoice) => void;
  // The notification setters update the state straight away and resolve once
  // the value is saved, so callers can await them before scheduling anything
  // that reads the saved value.
  setDailySaintsEnabled: (value: boolean) => Promise<void>;
  setFavouritesEnabled: (value: boolean) => Promise<void>;
  setCalendarNotification: (
    calendar: string,
    setting: Partial<CalendarNotificationSetting>,
  ) => Promise<void>;
  hydrate: () => Promise<void>;
}

// Stored calendar settings that cannot be parsed must not discard the other
// settings, so a failure here only leaves the calendars as they were.
async function loadCalendarNotifications(): Promise<
  CalendarNotificationSettings | undefined
> {
  try {
    return await getCalendarNotificationSettings();
  } catch (e) {
    console.error("Failed to load calendar notification settings", e);
    return undefined;
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Defaults, used until hydrate() resolves or when nothing is stored
  startOfWeek: "monday",
  themeChoice: "auto",
  dailySaintsEnabled: true,
  favouritesEnabled: true,
  calendarNotifications: {},
  hydrated: false,

  getStartOfWeek: () => get().startOfWeek,
  setStartOfWeek: (value) => {
    saveStartOfWeek(value);
    set({ startOfWeek: value });
  },
  setThemeChoice: (value) => {
    saveThemeChoice(value);
    set({ themeChoice: value });
  },
  setDailySaintsEnabled: async (value) => {
    set({ dailySaintsEnabled: value });
    await saveDailySaintNotificationsEnabled(value);
  },
  setFavouritesEnabled: async (value) => {
    set({ favouritesEnabled: value });
    await saveFavouriteNotificationsEnabled(value);
  },
  setCalendarNotification: async (calendar, setting) => {
    const current = get().calendarNotifications;
    const calendarNotifications = {
      ...current,
      [calendar]: { ...current[calendar], ...setting },
    } as CalendarNotificationSettings;
    set({ calendarNotifications });
    await saveCalendarNotificationSettings(calendarNotifications);
  },

  hydrate: async () => {
    try {
      const [
        startOfWeek,
        themeChoice,
        dailySaintsEnabled,
        favouritesEnabled,
        calendarNotifications,
      ] = await Promise.all([
        getStartOfWeek(),
        getThemeChoice(),
        isDailySaintNotificationsEnabled(),
        isFavouriteNotificationsEnabled(),
        loadCalendarNotifications(),
      ]);
      set({
        startOfWeek: startOfWeek ?? get().startOfWeek,
        themeChoice,
        dailySaintsEnabled,
        favouritesEnabled,
        calendarNotifications:
          calendarNotifications ?? get().calendarNotifications,
      });
    } catch (e) {
      // Fall back to the defaults rather than blocking app startup.
      console.error("Failed to load settings", e);
    } finally {
      set({ hydrated: true });
    }
  },
}));
