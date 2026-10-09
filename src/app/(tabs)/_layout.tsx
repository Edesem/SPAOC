import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = colorScheme === "dark" ? Colours.dark : Colours.light;

  // Dark text on the light tab bar and light text on the dark one, like the tint.
  const inactiveColour =
    Platform.OS === "ios"
      ? DynamicColorIOS({
          dark: Colours.dark.tabInactive,
          light: Colours.light.tabInactive,
        })
      : palette.tabInactive;

  const tintColor =
    Platform.OS === "ios"
      ? DynamicColorIOS({
          dark: Colours.dark.primary,
          light: Colours.light.primary,
        })
      : palette.primary;

  return (
    <NativeTabs
      tintColor={tintColor}
      iconColor={{ default: inactiveColour, selected: tintColor }}
      labelStyle={{
        default: { color: inactiveColour },
        selected: { color: tintColor },
      }}
    >
      <NativeTabs.Trigger name="(events)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "calendar", selected: "calendar" }}
          md="event"
        />
        <NativeTabs.Trigger.Label>Events</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favourites">
        <NativeTabs.Trigger.Icon
          sf={{ default: "star", selected: "star.fill" }}
          md="star"
        />
        <NativeTabs.Trigger.Label>Favourites</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prayer">
        <NativeTabs.Trigger.Icon
          sf={{ default: "book", selected: "book.fill" }}
          md="menu_book"
        />
        <NativeTabs.Trigger.Label>Prayer</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="parish">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "building.columns",
            selected: "building.columns.fill",
          }}
          md="church"
        />
        <NativeTabs.Trigger.Label>Parish</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
