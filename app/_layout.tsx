import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colours } from '@/styles/Colours';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/toastConfig';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
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
