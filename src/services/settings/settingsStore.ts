import { create } from "zustand";

import {
  getStartOfWeek,
  getThemeChoice,
  saveStartOfWeek,
  saveThemeChoice,
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
  hydrated: boolean;
  getStartOfWeek: () => StartOfWeek;
  setStartOfWeek: (value: StartOfWeek) => void;
  setThemeChoice: (value: ThemeChoice) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Defaults, used until hydrate() resolves or when nothing is stored
  startOfWeek: "monday",
  themeChoice: "auto",
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

  hydrate: async () => {
    try {
      const [startOfWeek, themeChoice] = await Promise.all([
        getStartOfWeek(),
        getThemeChoice(),
      ]);
      set({ startOfWeek: startOfWeek ?? get().startOfWeek, themeChoice });
    } catch (e) {
      // Fall back to the defaults rather than blocking app startup.
      console.error("Failed to load settings", e);
    } finally {
      set({ hydrated: true });
    }
  },
}));
