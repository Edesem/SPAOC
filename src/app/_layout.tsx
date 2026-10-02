import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colours } from '@/theme/colours';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/toastConfig';
import { useFavouritesStore } from '@/services/favourites';
import { useSettingsStore } from '@/services/settings';
import {
  requestNotificationPermissions,
  setupNotificationHandler,
  setupNotificationListeners,
} from '@/services/notifications/appNotifications';
import { scheduleSaintNotificationsForNext7Days } from '@/services/notifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('@assets/fonts/SpaceMono-Regular.ttf'),
  });

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
  // the handler, ask for permission, listen, and top up the saint schedule once
  // here, so it all works whichever screen opens first.
  useEffect(() => {
    setupNotificationHandler();
    requestNotificationPermissions();
    const removeListeners = setupNotificationListeners();
    scheduleSaintNotificationsForNext7Days();

    return removeListeners;
  }, []);

  const ready = loaded && hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  console.log("Theme selected:", colorScheme)
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={theme}>
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colorScheme === 'dark' ? Colours.dark.background : Colours.light.background },
          headerTintColor: colorScheme === 'dark' ? Colours.dark.moreImportantText : '#333',
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="eventDetails" />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="dailyReadings" />
        <Stack.Screen name="pdfViewer" options={{ title: 'PDF' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Toast config={toastConfig(colorScheme === 'dark' ? 'dark' : 'light')} topOffset={80} />
    </ThemeProvider>
  );
}
