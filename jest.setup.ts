jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Jest doesn't load .env, and calendar/index.ts now throws at import time
// when a calendar API key is missing. Give the test process a fixture value
// so that throw only fires for a genuinely missing key, not a test run.
process.env.EXPO_PUBLIC_IOS_CAL_DEV_KEY = "test-calendar-api-key";
process.env.EXPO_PUBLIC_IOS_CAL_PROD_KEY = "test-calendar-api-key";
process.env.EXPO_PUBLIC_ANDROID_CAL_DEV_KEY = "test-calendar-api-key";
process.env.EXPO_PUBLIC_ANDROID_CAL_PROD_KEY = "test-calendar-api-key";
