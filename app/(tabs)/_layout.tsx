import React from "react";
import { DynamicColorIOS, Platform } from "react-native";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/styles/Colours";

import { Ionicons } from "@expo/vector-icons";
import HomeScreen from ".";
import AboutScreen from "./about";
import FavouritesScreen from "./favourites";
import HelpScreen from "./help";
import PrayerScreen from "./prayer";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { createBottomTabNavigator } from "expo-router/build/react-navigation/bottom-tabs";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const Tab = createBottomTabNavigator();

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
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: tintColor,
          tabBarInactiveTintColor: "#888",
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Events")
              iconName = focused ? "calendar" : "calendar-outline";
            else if (route.name === "Favourites")
              iconName = focused ? "star" : "star-outline";
            else if (route.name === "About")
              iconName = focused ? "person" : "person-outline";
            else if (route.name === "Prayer")
              iconName = focused ? "book" : "book-outline";
            else if (route.name === "Help")
              iconName = focused ? "help-circle" : "help-circle-outline";

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Events" component={HomeScreen} />
        <Tab.Screen name="Favourites" component={FavouritesScreen} />
        <Tab.Screen name="Prayer" component={PrayerScreen} />
        <Tab.Screen name="About" component={AboutScreen} />
        <Tab.Screen name="Help" component={HelpScreen} />
      </Tab.Navigator>
    </ThemeProvider>
  );
}
