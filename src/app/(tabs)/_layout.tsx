import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";

const INACTIVE_COLOUR = "#888";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = colorScheme === "dark" ? Colours.dark : Colours.light;

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
      iconColor={{ default: INACTIVE_COLOUR, selected: tintColor }}
      labelStyle={{
        default: { color: INACTIVE_COLOUR },
        selected: { color: tintColor },
      }}
      // iOS keeps the system blur; Android needs an explicit surface colour.
      backgroundColor={
        Platform.OS === "android" ? palette.itemBackground : undefined
      }
    >
      <NativeTabs.Trigger name="index">
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
      <NativeTabs.Trigger name="about">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
        <NativeTabs.Trigger.Label>About</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="help">
        <NativeTabs.Trigger.Icon
          sf={{
            default: "questionmark.circle",
            selected: "questionmark.circle.fill",
          }}
          md="help"
        />
        <NativeTabs.Trigger.Label>Help</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
