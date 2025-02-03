import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colours } from '@/styles/Colours';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;

  return (
    <Tabs
      screenOptions={{
        //tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarActiveTintColor: theme.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <IconSymbol name="house.fill" size={28} color={color} />
            ) : (
              <MaterialIcons name="home" size={28} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          href: null,
          title: 'Book',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <IconSymbol name="calendar.badge.plus" size={28} color={color} />
            ) : (
              <MaterialIcons name="event" size={28} color={color} />
            )
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <IconSymbol name="book.fill" size={28} color={color} />
            ) : (
              <MaterialIcons name="import_contacts" size={28} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="donate"
        options={{
          title: 'Donate',
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <IconSymbol name="heart.fill" size={28} color={color} />
            ) : (
              <MaterialIcons name="favorite" size={28} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}



