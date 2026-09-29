import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SettingsScreen, { useSettingsStore } from "@/app/settings";
import {
  getCalendarNotificationSettings,
  getStartOfWeek,
  getThemeChoice,
  loadNotificationToggles,
  saveDailySaintNotificationsEnabled,
  saveStartOfWeek,
} from "@/services/settings";
import {
  cancelAllSaintNotifications,
  scheduleSaintNotificationsForNext7Days,
} from "@/utils/notifications";

// The screen is tested against a mocked settings repository. Storage keys,
// value formats and first-run defaults are covered by
// services/settings/settingsRepository.test.ts.

jest.mock("@/services/settings", () => ({
  getCalendarNotificationSettings: jest.fn(),
  getStartOfWeek: jest.fn(),
  getThemeChoice: jest.fn(),
  loadNotificationToggles: jest.fn(),
  saveCalendarNotificationSettings: jest.fn(),
  saveDailySaintNotificationsEnabled: jest.fn(),
  saveFavouriteNotificationsEnabled: jest.fn(),
  saveStartOfWeek: jest.fn(),
  saveThemeChoice: jest.fn(),
}));

jest.mock("@/utils/notifications", () => ({
  cancelAllFavouriteNotifications: jest.fn(),
  cancelAllSaintNotifications: jest.fn(),
  scheduleCategoryNotifications: jest.fn(),
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

jest.mock("@/components/SettingPicker", () => {
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
    useSettingsStore.setState({ startOfWeek: "monday" });
    (getThemeChoice as jest.Mock).mockResolvedValue("auto");
    (getStartOfWeek as jest.Mock).mockResolvedValue(null);
    (getCalendarNotificationSettings as jest.Mock).mockResolvedValue({});
    (loadNotificationToggles as jest.Mock).mockResolvedValue({
      dailySaints: true,
      favourites: true,
    });
  });

  it("shows the notification toggle loaded from the repository", async () => {
    (loadNotificationToggles as jest.Mock).mockResolvedValue({
      dailySaints: false,
      favourites: true,
    });

    const { getByRole } = await renderScreen();

    await waitFor(() => {
      expect(getByRole("switch").props.value).toBe(false);
    });
    expect(getCalendarNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it("saves and schedules saint notifications when the toggle is turned on", async () => {
    (loadNotificationToggles as jest.Mock).mockResolvedValue({
      dailySaints: false,
      favourites: true,
    });
    const { getByRole } = await renderScreen();
    await waitFor(() => expect(getByRole("switch").props.value).toBe(false));

    fireEvent(getByRole("switch"), "valueChange", true);

    await waitFor(() => {
      expect(scheduleSaintNotificationsForNext7Days).toHaveBeenCalled();
    });
    expect(saveDailySaintNotificationsEnabled).toHaveBeenCalledWith(true);
    expect(getByRole("switch").props.value).toBe(true);
  });

  it("saves and cancels saint notifications when the toggle is turned off", async () => {
    const consoleLog = jest.spyOn(console, "log").mockImplementation();
    const { getByRole } = await renderScreen();
    await waitFor(() => expect(getByRole("switch").props.value).toBe(true));

    fireEvent(getByRole("switch"), "valueChange", false);

    await waitFor(() => {
      expect(cancelAllSaintNotifications).toHaveBeenCalled();
    });
    expect(saveDailySaintNotificationsEnabled).toHaveBeenCalledWith(false);
    expect(scheduleSaintNotificationsForNext7Days).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it("loads the saved start of week and saves a new choice", async () => {
    (getStartOfWeek as jest.Mock).mockResolvedValue("sunday");

    const { findByText, getByTestId } = await renderScreen();

    expect(await findByText("sunday")).toBeTruthy();

    fireEvent(getByTestId("picker-Start of the Week"), "valueChange", "monday");

    expect(await findByText("monday")).toBeTruthy();
    expect(saveStartOfWeek).toHaveBeenCalledWith("monday");
  });

  it("keeps the default start of week when none is saved", async () => {
    const { getByTestId } = await renderScreen();

    await waitFor(() => expect(getStartOfWeek).toHaveBeenCalled());
    expect(getByTestId("picker-Start of the Week").props.children).toBe(
      "monday",
    );
  });

  it("logs an error when calendar notification settings fail to load", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const error = new SyntaxError("Unexpected token");
    (getCalendarNotificationSettings as jest.Mock).mockRejectedValue(error);

    await renderScreen();

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(error);
    });
    consoleError.mockRestore();
  });

  it("does not read or write settings storage directly", async () => {
    const { getByRole } = await renderScreen();
    await waitFor(() => expect(loadNotificationToggles).toHaveBeenCalled());

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
