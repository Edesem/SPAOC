import AsyncStorage from "@react-native-async-storage/async-storage";

import { useSettingsStore } from "./settingsStore";

const initialState = useSettingsStore.getState();

describe("settingsStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSettingsStore.setState(initialState, true);
  });

  it("defaults to a Monday week start and the automatic theme", () => {
    const state = useSettingsStore.getState();

    expect(state.getStartOfWeek()).toBe("monday");
    expect(state.themeChoice).toBe("auto");
    expect(state.hydrated).toBe(false);
  });

  it("hydrates the persisted values and marks the store hydrated", async () => {
    await AsyncStorage.setItem("START_OF_WEEK", "sunday");
    await AsyncStorage.setItem("APP_THEME", "dark");

    await useSettingsStore.getState().hydrate();

    const state = useSettingsStore.getState();
    expect(state.getStartOfWeek()).toBe("sunday");
    expect(state.themeChoice).toBe("dark");
    expect(state.hydrated).toBe(true);
  });

  it("keeps the defaults when nothing is stored", async () => {
    await useSettingsStore.getState().hydrate();

    const state = useSettingsStore.getState();
    expect(state.getStartOfWeek()).toBe("monday");
    expect(state.themeChoice).toBe("auto");
    expect(state.hydrated).toBe(true);
  });

  it("still marks the store hydrated when storage fails", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    jest
      .spyOn(AsyncStorage, "getItem")
      .mockRejectedValueOnce(new Error("boom"));

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().hydrated).toBe(true);
    expect(useSettingsStore.getState().getStartOfWeek()).toBe("monday");
    error.mockRestore();
  });

  it("persists and updates the start of week", async () => {
    useSettingsStore.getState().setStartOfWeek("sunday");

    expect(useSettingsStore.getState().getStartOfWeek()).toBe("sunday");
    await expect(AsyncStorage.getItem("START_OF_WEEK")).resolves.toBe("sunday");
  });

  it("persists and updates the theme choice", async () => {
    useSettingsStore.getState().setThemeChoice("light");

    expect(useSettingsStore.getState().themeChoice).toBe("light");
    await expect(AsyncStorage.getItem("APP_THEME")).resolves.toBe("light");
  });
  describe("notification settings", () => {
    it("defaults to saints and favourites on with no calendar settings", () => {
      const state = useSettingsStore.getState();

      expect(state.dailySaintsEnabled).toBe(true);
      expect(state.favouritesEnabled).toBe(true);
      expect(state.calendarNotifications).toEqual({});
    });

    it("hydrates the persisted notification settings", async () => {
      const calendars = { youth: { enabled: true, daysBefore: 3 } };
      await AsyncStorage.setItem("dailySaintsNotificationsEnabled", "false");
      await AsyncStorage.setItem("favouriteNotificationsEnabled", "false");
      await AsyncStorage.setItem(
        "calendarNotificationSettings",
        JSON.stringify(calendars),
      );

      await useSettingsStore.getState().hydrate();

      const state = useSettingsStore.getState();
      expect(state.dailySaintsEnabled).toBe(false);
      expect(state.favouritesEnabled).toBe(false);
      expect(state.calendarNotifications).toEqual(calendars);
    });

    it("hydrates a fresh install with saints on and every calendar disabled", async () => {
      await useSettingsStore.getState().hydrate();

      const state = useSettingsStore.getState();
      expect(state.dailySaintsEnabled).toBe(true);
      expect(state.favouritesEnabled).toBe(true);
      expect(state.calendarNotifications.youth).toEqual({
        enabled: false,
        daysBefore: 1,
      });
    });

    it("keeps the other settings when the stored calendar settings are invalid", async () => {
      const error = jest.spyOn(console, "error").mockImplementation(() => {});
      await AsyncStorage.setItem("calendarNotificationSettings", "{not json");
      await AsyncStorage.setItem("START_OF_WEEK", "sunday");
      await AsyncStorage.setItem("dailySaintsNotificationsEnabled", "false");

      await useSettingsStore.getState().hydrate();

      const state = useSettingsStore.getState();
      expect(state.getStartOfWeek()).toBe("sunday");
      expect(state.dailySaintsEnabled).toBe(false);
      expect(state.calendarNotifications).toEqual({});
      expect(state.hydrated).toBe(true);
      expect(error).toHaveBeenCalled();
      error.mockRestore();
    });

    it("persists and updates the daily saints switch", async () => {
      await useSettingsStore.getState().setDailySaintsEnabled(false);

      expect(useSettingsStore.getState().dailySaintsEnabled).toBe(false);
      await expect(
        AsyncStorage.getItem("dailySaintsNotificationsEnabled"),
      ).resolves.toBe("false");
    });

    it("persists and updates the favourites switch", async () => {
      await useSettingsStore.getState().setFavouritesEnabled(false);

      expect(useSettingsStore.getState().favouritesEnabled).toBe(false);
      await expect(
        AsyncStorage.getItem("favouriteNotificationsEnabled"),
      ).resolves.toBe("false");
    });

    it("merges a calendar update into its existing setting and saves all calendars", async () => {
      useSettingsStore.setState({
        calendarNotifications: {
          youth: { enabled: false, daysBefore: 1 },
          church: { enabled: true, daysBefore: 2 },
        },
      });

      await useSettingsStore
        .getState()
        .setCalendarNotification("youth", { enabled: true });

      const expected = {
        youth: { enabled: true, daysBefore: 1 },
        church: { enabled: true, daysBefore: 2 },
      };
      expect(useSettingsStore.getState().calendarNotifications).toEqual(
        expected,
      );
      const stored = await AsyncStorage.getItem("calendarNotificationSettings");
      expect(JSON.parse(stored as string)).toEqual(expected);
    });
  });
});
