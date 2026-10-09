import { useColorScheme } from "@/hooks/useColorScheme";
import {
  glassHeaderOptions,
  largeTitleHeaderOptions,
} from "@/theme/headerOptions";
import { Stack } from "expo-router";

// Native tabs draw no header of their own, so each tab holds a one-screen
// stack. That stack's header is Liquid Glass on iOS 26+ and the solid themed
// app bar elsewhere. The title is always given: without one the header would
// fall back to the route name. The orientation is pinned here too: iOS asks the
// selected tab's stack, not the root stack, so a screen with none set would
// inherit the app's allowed orientations (landscape included, for the PDF).
export function TabStack({
  title,
  largeTitle = false,
}: {
  title: string;
  largeTitle?: boolean;
}) {
  const colorScheme = useColorScheme();
  const options = largeTitle
    ? largeTitleHeaderOptions(colorScheme)
    : glassHeaderOptions(colorScheme);

  return (
    <Stack screenOptions={{ ...options, title, orientation: "portrait" }} />
  );
}
