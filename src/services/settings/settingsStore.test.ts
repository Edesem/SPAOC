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
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("boom"));

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
});
