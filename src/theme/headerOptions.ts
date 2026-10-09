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
    headerTitleAlign: "left",
    // Without this the back button is labelled with the previous route's name,
    // which for a screen pushed from the tabs is "(tabs)".
    headerBackTitle: "Back",
    headerStyle: { backgroundColor: palette.background },
    headerTintColor: palette.moreImportantText,
    headerTitleStyle,
  };
};

// On iOS 26+ the header is transparent so the system draws the glass and a soft
// scroll-edge fade over whatever scrolls beneath it. A background colour or a
// blur effect would switch the glass off, so neither is set. `headerStyle` is
// set to undefined on purpose: the navigator merges these options over the
// root stack's solid defaults key by key, so leaving it out would keep that
// opaque background. The top edge is asked to be soft because the default
// (`automatic`) can resolve to a hard cut-off line.
export const glassHeaderOptions = (
  scheme: Scheme,
): NativeStackNavigationOptions => {
  if (!supportsLiquidGlass()) {
    return solidHeaderOptions(scheme);
  }
  const palette = scheme === "dark" ? Colours.dark : Colours.light;
  return {
    headerTransparent: true,
    headerStyle: undefined,
    headerShadowVisible: false,
    headerTintColor: palette.moreImportantText,
    headerTitleStyle,
    scrollEdgeEffects: { top: "soft" },
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
