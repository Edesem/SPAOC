import React from "react";
import { DynamicColorIOS, Platform, StyleSheet } from "react-native";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/styles/Colours";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;

  return (
    <NativeTabs
      // For the selected icon color
      tintColor={DynamicColorIOS({
        dark: Colours.dark.primary,
        light: Colours.light.primary,
      })}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favourites">
        <Label>Favourites</Label>
        <Icon sf="star.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="about">
        <Label>About</Label>
        <Icon sf="person.circle.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="prayer">
        <Label>Prayer</Label>
        <Icon sf="book.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="help">
        <Label>Help</Label>
        <Icon sf="questionmark.circle.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
