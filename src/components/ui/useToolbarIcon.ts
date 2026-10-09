import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { Stack } from "expo-router";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { Platform, type ImageSourcePropType } from "react-native";

type ToolbarIcon = NonNullable<
  ComponentProps<typeof Stack.Toolbar.Button>["icon"]
>;
export type SfSymbolName = Extract<ToolbarIcon, string>;
export type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const ANDROID_ICON_SIZE = 24;

// iOS toolbar buttons take an SF Symbol name; Android's only take an image, so
// the matching Material glyph is rendered to one. Returns undefined on Android
// until that image is ready, which leaves the button out for a frame.
export function useToolbarIcon(
  sf: SfSymbolName,
  material: MaterialIconName,
  color: string,
): ToolbarIcon | undefined {
  const [androidIcon, setAndroidIcon] = useState<ImageSourcePropType>();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    let cancelled = false;
    MaterialIcons.getImageSource(material, ANDROID_ICON_SIZE, color)
      .then((source) => {
        if (!cancelled && source) setAndroidIcon(source);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [material, color]);

  return Platform.OS === "android" ? androidIcon : sf;
}
