import type { NativeStackNavigationOptions } from "expo-router";
import { Platform } from "react-native";
import { Colours } from "./colours";
import { headerLargeTitleStyle, headerTitleStyle } from "./typography";

type Scheme = "light" | "dark";

// iOS 26 introduced Liquid Glass; earlier iOS and Android have no equivalent
// native header material, so they keep a solid themed header.
export const supportsLiquidGlass = (): boolean =>
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;

export const solidHeaderOptions = (
  scheme: Scheme,
): NativeStackNavigationOptions => {
  const palette = scheme === "dark" ? Colours.dark : Colours.light;
  return {
    headerTitleAlign: "center",
    headerStyle: { backgroundColor: palette.background },
    headerTintColor: palette.moreImportantText,
    headerTitleStyle,
  };
};

// On iOS 26+ the header is transparent so the system draws the glass and the
// soft scroll-edge fade over whatever scrolls beneath it. A background colour
// or a blur effect here would switch the glass off, so neither is set.
export const glassHeaderOptions = (
  scheme: Scheme,
): NativeStackNavigationOptions => {
  if (!supportsLiquidGlass()) {
    return solidHeaderOptions(scheme);
  }
  const palette = scheme === "dark" ? Colours.dark : Colours.light;
  return {
    headerTransparent: true,
    headerShadowVisible: false,
    headerTintColor: palette.moreImportantText,
    headerTitleStyle,
  };
};

// A native large title that collapses into the bar on scroll. Android has no
// large title, so it shows the plain solid app bar title.
export const largeTitleHeaderOptions = (
  scheme: Scheme,
): NativeStackNavigationOptions => {
  if (!supportsLiquidGlass()) {
    return solidHeaderOptions(scheme);
  }
  const palette = scheme === "dark" ? Colours.dark : Colours.light;
  return {
    ...glassHeaderOptions(scheme),
    headerLargeTitleEnabled: true,
    headerLargeTitleShadowVisible: false,
    headerLargeTitleStyle: {
      ...headerLargeTitleStyle,
      color: palette.moreImportantText,
    },
  };
};
