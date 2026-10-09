import RootLayout from "@/app/_layout";
import { useFavouritesStore } from "@/features/calendar";
import {
  requestNotificationPermissions,
  setupNotificationHandler,
  setupNotificationListeners,
  syncNotifications,
} from "@/features/notifications";
import { useSettingsStore } from "@/services/settings";
import { fontFamily } from "@/theme/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, waitFor } from "@testing-library/react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { Platform } from "react-native";

// Alegreya is embedded at build time by the expo-font plugin, so the layout
// must not load or wait for any font at runtime.
jest.mock("expo-font", () => ({ useFonts: jest.fn(() => [false]) }));
const mockStackProps = jest.fn();
const mockScreenProps = jest.fn();
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("react-native-toast-message", () => () => null);
jest.mock("@/features/notifications", () => ({
  setupNotificationHandler: jest.fn(),
  requestNotificationPermissions: jest.fn(),
  setupNotificationListeners: jest.fn(),
  syncNotifications: jest.fn(),
}));
jest.mock("@/components/ui/toastConfig", () => ({ toastConfig: () => ({}) }));
jest.mock("expo-router", () => {
  const { View } = require("react-native");
  const Stack = (props: { children?: React.ReactNode }) => {
    mockStackProps(props);
    return <View testID="stack">{props.children}</View>;
  };
  Stack.Screen = (props: object) => {
    mockScreenProps(props);
    return null;
  };
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

  // The hydrate spies replace a method on the shared initial state, so they
  // must be undone or later tests would never finish hydrating
  afterEach(() => jest.restoreAllMocks());

  it("hydrates the settings store before rendering the app", async () => {
    await AsyncStorage.setItem("START_OF_WEEK", "sunday");

    const { queryByTestId } = await render(<RootLayout />);

    await waitFor(() => expect(queryByTestId("stack")).toBeTruthy());
    expect(useSettingsStore.getState().hydrated).toBe(true);
    expect(useSettingsStore.getState().getStartOfWeek()).toBe("sunday");
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it("renders without loading a font at runtime", async () => {
    const { queryByTestId } = await render(<RootLayout />);

    await waitFor(() => expect(queryByTestId("stack")).toBeTruthy());
    expect(useFonts).not.toHaveBeenCalled();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it("sets stack header titles in the serif", async () => {
    await render(<RootLayout />);

    await waitFor(() => expect(mockStackProps).toHaveBeenCalled());
    const { screenOptions } = mockStackProps.mock.calls.at(-1)![0];
    expect(screenOptions.headerTitleStyle).toEqual({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
  });

  it.each(["eventDetails", "dailyReadings", "settings", "help"])(
    "gives %s the glass header on iOS 26",
    async (name) => {
      jest.replaceProperty(Platform, "OS", "ios");
      jest.spyOn(Platform, "Version", "get").mockReturnValue("26.0" as never);

      await render(<RootLayout />);

      await waitFor(() => expect(mockScreenProps).toHaveBeenCalled());
      const screen = mockScreenProps.mock.calls
        .map(([props]) => props)
        .find((props) => props.name === name);
      expect(screen.options.headerTransparent).toBe(true);
      expect(screen.options.headerShown).not.toBe(false);
      expect(screen.options).toHaveProperty("headerStyle", undefined);
    },
  );

  it("titles the settings header", async () => {
    await render(<RootLayout />);

    await waitFor(() => expect(mockScreenProps).toHaveBeenCalled());
    const settings = mockScreenProps.mock.calls
      .map(([props]) => props)
      .find((props) => props.name === "settings");
    expect(settings.options.title).toBe("Settings");
  });

  it("titles the help header", async () => {
    await render(<RootLayout />);

    await waitFor(() => expect(mockScreenProps).toHaveBeenCalled());
    const help = mockScreenProps.mock.calls
      .map(([props]) => props)
      .find((props) => props.name === "help");
    expect(help.options.title).toBe("Help & Feedback");
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

    it("syncs notifications once at startup, after settings have loaded", async () => {
      await AsyncStorage.setItem("dailySaintsNotificationsEnabled", "false");
      let enabledWhenSynced: boolean | undefined;
      (syncNotifications as jest.Mock).mockImplementation(() => {
        enabledWhenSynced = useSettingsStore.getState().dailySaintsEnabled;
      });

      await render(<RootLayout />);

      await waitFor(() => expect(syncNotifications).toHaveBeenCalledTimes(1));
      expect(enabledWhenSynced).toBe(false);
    });

    it("does not sync notifications while settings are still loading", async () => {
      jest
        .spyOn(useSettingsStore.getState(), "hydrate")
        .mockImplementation(() => new Promise<void>(() => {}));
      useSettingsStore.setState({
        hydrate: useSettingsStore.getState().hydrate,
      });

      await render(<RootLayout />);

      expect(syncNotifications).not.toHaveBeenCalled();
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
