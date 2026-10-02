import { getCalendarApiKey } from "@/config/env";
import { Platform } from "react-native";

const KEYS = [
  "EXPO_PUBLIC_IOS_CAL_DEV_KEY",
  "EXPO_PUBLIC_IOS_CAL_PROD_KEY",
  "EXPO_PUBLIC_ANDROID_CAL_DEV_KEY",
  "EXPO_PUBLIC_ANDROID_CAL_PROD_KEY",
] as const;

describe("getCalendarApiKey", () => {
  const originalOS = Platform.OS;
  const originalEnv = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

  beforeEach(() => {
    KEYS.forEach((k) => {
      process.env[k] = `value-of-${k}`;
    });
  });

  afterEach(() => {
    Platform.OS = originalOS;
    KEYS.forEach((k) => {
      if (originalEnv[k] === undefined) delete process.env[k];
      else process.env[k] = originalEnv[k];
    });
  });

  it("uses the iOS dev key in a dev build on iOS", () => {
    Platform.OS = "ios";

    expect(getCalendarApiKey()).toBe("value-of-EXPO_PUBLIC_IOS_CAL_DEV_KEY");
  });

  it("uses the Android dev key in a dev build on Android", () => {
    Platform.OS = "android";

    expect(getCalendarApiKey()).toBe(
      "value-of-EXPO_PUBLIC_ANDROID_CAL_DEV_KEY",
    );
  });

  it("uses the production keys outside a dev build", () => {
    const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    try {
      Platform.OS = "ios";
      expect(getCalendarApiKey()).toBe("value-of-EXPO_PUBLIC_IOS_CAL_PROD_KEY");

      Platform.OS = "android";
      expect(getCalendarApiKey()).toBe(
        "value-of-EXPO_PUBLIC_ANDROID_CAL_PROD_KEY",
      );
    } finally {
      (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
    }
  });

  it("throws when the key for this platform and build is missing", () => {
    Platform.OS = "ios";
    delete process.env.EXPO_PUBLIC_IOS_CAL_DEV_KEY;

    expect(() => getCalendarApiKey()).toThrow(/Missing calendar API key/);
  });
});
