import RootLayout from "@/app/_layout";
import {
  requestNotificationPermissions,
  setupNotificationHandler,
  setupNotificationListeners,
} from "@/notifications";
import { scheduleSaintNotificationsForNext7Days } from "@/services/notifications";
import { useFavouritesStore } from "@/services/favourites";
import { useSettingsStore } from "@/services/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, waitFor } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";
import React from "react";

jest.mock("expo-font", () => ({ useFonts: () => [true] }));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("react-native-toast-message", () => () => null);
jest.mock("@/notifications", () => ({
  setupNotificationHandler: jest.fn(),
  requestNotificationPermissions: jest.fn(),
  setupNotificationListeners: jest.fn(),
}));
jest.mock("@/services/notifications", () => ({
  scheduleSaintNotificationsForNext7Days: jest.fn(),
}));
jest.mock("@/components/ui/toastConfig", () => ({ toastConfig: () => ({}) }));
jest.mock("expo-router", () => {
  const { View } = require("react-native");
  const Stack = ({ children }: { children?: React.ReactNode }) => (
    <View testID="stack">{children}</View>
  );
  Stack.Screen = () => null;
  return {
    Stack,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    DarkTheme: {},
    DefaultTheme: {},
  };
});

const initialState = useSettingsStore.getState();
const initialFavouritesState = useFavouritesStore.getState();

describe("RootLayout", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    (setupNotificationListeners as jest.Mock).mockReturnValue(() => {});
    await AsyncStorage.clear();
    useSettingsStore.setState(initialState, true);
    useFavouritesStore.setState(initialFavouritesState, true);
  });

  it("hydrates the settings store before rendering the app", async () => {
    await AsyncStorage.setItem("START_OF_WEEK", "sunday");

    const { queryByTestId } = await render(<RootLayout />);

    await waitFor(() => expect(queryByTestId("stack")).toBeTruthy());
    expect(useSettingsStore.getState().hydrated).toBe(true);
    expect(useSettingsStore.getState().getStartOfWeek()).toBe("sunday");
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it("hydrates the favourites store at startup", async () => {
    const event = { id: "a", title: "Divine Liturgy" };
    await AsyncStorage.setItem("favourites", JSON.stringify({ a: event }));

    await render(<RootLayout />);

    await waitFor(() =>
      expect(useFavouritesStore.getState().hydrated).toBe(true),
    );
    expect(useFavouritesStore.getState().isFavourite(event as any)).toBe(true);
  });

  it("holds the splash screen until settings have loaded", async () => {
    let release: () => void = () => {};
    jest
      .spyOn(useSettingsStore.getState(), "hydrate")
      .mockImplementation(() => new Promise<void>((r) => (release = r)));
    useSettingsStore.setState({ hydrate: useSettingsStore.getState().hydrate });

    const { queryByTestId } = await render(<RootLayout />);

    expect(queryByTestId("stack")).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    await act(async () => {
      useSettingsStore.setState({ hydrated: true });
      release();
    });

    expect(queryByTestId("stack")).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
  describe("notification infrastructure", () => {
    it("installs the notification handler before the app is ready to render", async () => {
      jest
        .spyOn(useSettingsStore.getState(), "hydrate")
        .mockImplementation(() => new Promise<void>(() => {}));
      useSettingsStore.setState({
        hydrate: useSettingsStore.getState().hydrate,
      });

      const { queryByTestId } = await render(<RootLayout />);

      expect(queryByTestId("stack")).toBeNull();
      expect(setupNotificationHandler).toHaveBeenCalledTimes(1);
    });

    it("requests notification permissions once at startup", async () => {
      await render(<RootLayout />);

      expect(requestNotificationPermissions).toHaveBeenCalledTimes(1);
    });

    it("schedules the saint notifications once at startup", async () => {
      await render(<RootLayout />);

      expect(scheduleSaintNotificationsForNext7Days).toHaveBeenCalledTimes(1);
    });

    it("adds the notification listeners and removes them on unmount", async () => {
      const removeListeners = jest.fn();
      (setupNotificationListeners as jest.Mock).mockReturnValue(
        removeListeners,
      );

      const { unmount } = await render(<RootLayout />);

      expect(setupNotificationListeners).toHaveBeenCalledTimes(1);
      expect(removeListeners).not.toHaveBeenCalled();

      await unmount();

      expect(removeListeners).toHaveBeenCalledTimes(1);
    });
  });
});
