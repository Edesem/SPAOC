import React from "react";
import { DynamicColorIOS, Platform } from "react-native";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/styles/Colours";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const tintColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: Colours.dark.primary, light: Colours.light.primary })
    : colorScheme === 'dark'
    ? Colours.dark.primary
    : Colours.light.primary;


  return (
    <NativeTabs
      // For the selected icon color
      tintColor={tintColor}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favourites">
        <Label>Favourites</Label>
        <Icon sf={{ default: 'star', selected: 'star.fill' }} drawable="star" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="about">
        <Label>About</Label>
        <Icon sf={{ default: 'person.circle', selected: 'person.circle.fill' }} drawable="person" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="prayer">
        <Label>Prayer</Label>
        <Icon sf={{ default: 'book', selected: 'book.fill' }} drawable="book-open-variant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="help">
        <Label>Help</Label>
        <Icon sf={{ default: 'questionmark.circle', selected: 'questionmark.circle.fill' }} drawable="help" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
