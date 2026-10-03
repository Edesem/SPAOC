import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SettingsScreen from "./SettingsScreen";
import {
  getCalendarNotificationSettings,
  saveDailySaintNotificationsEnabled,
  saveStartOfWeek,
  useSettingsStore,
} from "@/services/settings";
import {
  cancelAllSaintNotifications,
  scheduleSaintNotificationsForNext7Days,
} from "@/features/notifications";

// The screen is tested against a mocked settings repository. Storage keys,
// value formats and first-run defaults are covered by
// services/settings/settingsRepository.test.ts, and the settings store by
// services/settings/settingsStore.test.ts.

jest.mock("@/services/settings/settingsRepository", () => ({
  getCalendarNotificationSettings: jest.fn(),
  getStartOfWeek: jest.fn(),
  getThemeChoice: jest.fn(),
  saveCalendarNotificationSettings: jest.fn(),
  saveDailySaintNotificationsEnabled: jest.fn(),
  saveFavouriteNotificationsEnabled: jest.fn(),
  saveStartOfWeek: jest.fn(),
  saveThemeChoice: jest.fn(),
}));

jest.mock("@/features/notifications", () => ({
  cancelAllFavouriteNotifications: jest.fn(),
  cancelAllSaintNotifications: jest.fn(),
  scheduleFavouriteNotifications: jest.fn(),
  scheduleSaintNotificationsForNext7Days: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");

  const SafeArea = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);

  return {
    SafeAreaProvider: SafeArea,
    SafeAreaView: SafeArea,
  };
});

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("../components/SettingPicker", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return ({
    label,
    value,
    onValueChange,
  }: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
  }) =>
    React.createElement(
      Text,
      { testID: `picker-${label}`, onValueChange },
      value,
    );
});

const SETTINGS_KEYS = [
  "START_OF_WEEK",
  "APP_THEME",
  "dailySaintsNotificationsEnabled",
  "favouriteNotificationsEnabled",
  "calendarNotificationSettings",
];

const renderScreen = () => render(React.createElement(SettingsScreen));

describe("settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({
      startOfWeek: "monday",
      themeChoice: "auto",
      dailySaintsEnabled: true,
      favouritesEnabled: true,
      calendarNotifications: {},
    });
  });

  it("shows the saint notification switch from the store without loading it again", async () => {
    useSettingsStore.setState({ dailySaintsEnabled: false });

    const { getByRole } = await renderScreen();

    expect(getByRole("switch").props.value).toBe(false);
    expect(getCalendarNotificationSettings).not.toHaveBeenCalled();
  });

  it("saves the setting before scheduling saint notifications when the toggle is turned on", async () => {
    useSettingsStore.setState({ dailySaintsEnabled: false });
    let finishSaving: () => void = () => {};
    (saveDailySaintNotificationsEnabled as jest.Mock).mockReturnValueOnce(
      new Promise<void>((resolve) => (finishSaving = resolve)),
    );
    const { getByRole } = await renderScreen();

    fireEvent(getByRole("switch"), "valueChange", true);

    expect(saveDailySaintNotificationsEnabled).toHaveBeenCalledWith(true);
    expect(useSettingsStore.getState().dailySaintsEnabled).toBe(true);
    await waitFor(() => expect(getByRole("switch").props.value).toBe(true));
    expect(scheduleSaintNotificationsForNext7Days).not.toHaveBeenCalled();

    finishSaving();
    await waitFor(() => {
      expect(scheduleSaintNotificationsForNext7Days).toHaveBeenCalled();
    });
  });

  it("saves and cancels saint notifications when the toggle is turned off", async () => {
    const consoleLog = jest.spyOn(console, "log").mockImplementation();
    const { getByRole } = await renderScreen();
    expect(getByRole("switch").props.value).toBe(true);

    fireEvent(getByRole("switch"), "valueChange", false);

    await waitFor(() => {
      expect(cancelAllSaintNotifications).toHaveBeenCalled();
    });
    expect(saveDailySaintNotificationsEnabled).toHaveBeenCalledWith(false);
    expect(useSettingsStore.getState().dailySaintsEnabled).toBe(false);
    expect(scheduleSaintNotificationsForNext7Days).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it("shows the hydrated start of week and saves a new choice", async () => {
    useSettingsStore.setState({ startOfWeek: "sunday" });

    const { findByText, getByTestId } = await renderScreen();

    expect(await findByText("sunday")).toBeTruthy();

    fireEvent(getByTestId("picker-Start of the Week"), "valueChange", "monday");

    expect(await findByText("monday")).toBeTruthy();
    expect(saveStartOfWeek).toHaveBeenCalledWith("monday");
  });

  it("does not read or write settings storage directly", async () => {
    const { getByRole } = await renderScreen();
    fireEvent(getByRole("switch"), "valueChange", true);
    await waitFor(() => {
      expect(saveDailySaintNotificationsEnabled).toHaveBeenCalled();
    });

    SETTINGS_KEYS.forEach((key) => {
      expect(AsyncStorage.getItem).not.toHaveBeenCalledWith(key);
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
        key,
        expect.anything(),
      );
    });
  });
});
