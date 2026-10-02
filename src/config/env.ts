import { Platform } from "react-native";

// The only place that reads EXPO_PUBLIC_* environment variables. Expo inlines
// them at bundle time, so each one must be written out as a literal
// `process.env.EXPO_PUBLIC_NAME` access (no destructuring or dynamic lookup).
// Add new variables to .env.example as well.

// The Google Calendar API key for this platform and build. Throws when it is
// unset so a missing .env fails loudly at start-up rather than as empty
// calendars.
export function getCalendarApiKey(): string {
  const key = Platform.OS === "ios"
    ? __DEV__
      ? process.env.EXPO_PUBLIC_IOS_CAL_DEV_KEY
      : process.env.EXPO_PUBLIC_IOS_CAL_PROD_KEY
    : __DEV__
      ? process.env.EXPO_PUBLIC_ANDROID_CAL_DEV_KEY
      : process.env.EXPO_PUBLIC_ANDROID_CAL_PROD_KEY;

  if (!key) {
    throw new Error(
      "Missing calendar API key: set the EXPO_PUBLIC_*_CAL_*_KEY environment variable for this platform and build.",
    );
  }

  return key;
}
