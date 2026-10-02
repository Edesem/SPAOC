import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { ColorValue, DynamicColorIOS, Platform } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from "expo-router";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Ionicons>["name"];

const tabIcon = (focusedName: IconName, name: IconName) => {
  const TabIcon = ({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: ColorValue;
    size: number;
  }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color} />
  );

  return TabIcon;
};

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const tintColor =
    Platform.OS === "ios"
      ? DynamicColorIOS({
          dark: Colours.dark.primary,
          light: Colours.light.primary,
        })
      : colorScheme === "dark"
        ? Colours.dark.primary
        : Colours.light.primary;

  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={theme}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: tintColor,
          tabBarInactiveTintColor: "#888",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Events",
            tabBarIcon: tabIcon("calendar", "calendar-outline"),
          }}
        />
        <Tabs.Screen
          name="favourites"
          options={{
            title: "Favourites",
            tabBarIcon: tabIcon("star", "star-outline"),
          }}
        />
        <Tabs.Screen
          name="prayer"
          options={{
            title: "Prayer",
            tabBarIcon: tabIcon("book", "book-outline"),
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            title: "About",
            tabBarIcon: tabIcon("person", "person-outline"),
          }}
        />
        <Tabs.Screen
          name="help"
          options={{
            title: "Help",
            tabBarIcon: tabIcon("help-circle", "help-circle-outline"),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
