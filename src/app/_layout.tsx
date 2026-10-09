import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { glassHeaderOptions, solidHeaderOptions } from '@/theme/headerOptions';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/toastConfig';
import { useFavouritesStore } from '@/features/calendar';
import { useSettingsStore } from '@/services/settings';
import {
  requestNotificationPermissions,
  setupNotificationHandler,
  setupNotificationListeners,
  syncNotifications,
} from '@/features/notifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const hydrated = useSettingsStore((state) => state.hydrated);

  // Load persisted settings once at startup so the first screen already has
  // the saved start of week and theme.
  useEffect(() => {
    useSettingsStore.getState().hydrate();
  }, []);

  // Load every favourite in one read so event rows can check their star from
  // memory. Unlike settings this doesn't hold the splash screen: a star filling
  // in a moment later is harmless.
  useEffect(() => {
    useFavouritesStore.getState().hydrate();
  }, []);

  // Notification infrastructure belongs to the app, not to a screen: install
  // the handler, ask for permission and listen here, so it all works whichever
  // screen opens first.
  useEffect(() => {
    setupNotificationHandler();
    requestNotificationPermissions();
    return setupNotificationListeners();
  }, []);

  // Bring the schedule up to date once settings have loaded. Before that the
  // store only holds defaults, which could schedule what the user switched off.
  useEffect(() => {
    if (hydrated) {
      syncNotifications();
    }
  }, [hydrated]);

  // The Alegreya fonts are embedded by the expo-font plugin (app.json), so only
  // settings hold the splash screen.
  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync();
    }
  }, [hydrated]);

  if (!hydrated) {
    return null;
  }

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={solidHeaderOptions(colorScheme)}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="eventDetails" options={glassHeaderOptions(colorScheme)} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="dailyReadings" options={glassHeaderOptions(colorScheme)} />
        <Stack.Screen name="pdfViewer" options={{ title: 'PDF' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Toast config={toastConfig(colorScheme === 'dark' ? 'dark' : 'light')} topOffset={80} />
    </ThemeProvider>
  );
}
