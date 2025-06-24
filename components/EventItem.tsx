import React, { useState, useEffect } from "react";
import { ItemProps } from "@/types/global";
import { useRouter } from "expo-router";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colours } from "@/styles/Colours";

const FAVORITES_KEY = "favorites";

export const EventItem = ({ item, onPress }: ItemProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [isFavorite, setIsFavorite] = useState(false);

  // Load favorite status on mount
  useEffect(() => {
    const loadFavorite = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          // Use unique key - here assume item.id or fallback to title
          const key = item.id ?? item.title;
          setIsFavorite(!!favorites[key]);
        }
      } catch (e) {
        console.error("Failed to load favorites", e);
      }
    };
    loadFavorite();
  }, [item]);

  // Toggle favorite and save state
  const toggleFavorite = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      const favorites = storedFavorites ? JSON.parse(storedFavorites) : {};
      const key = item.id ?? item.title;

      const newStatus = !isFavorite;
      favorites[key] = newStatus;

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      setIsFavorite(newStatus);
    } catch (e) {
      console.error("Failed to save favorite", e);
    }
  };

  const isAllDayEvent = item.start && !item.start.includes("T");
  const eventStart = new Date(item.start);
  const eventEnd = new Date(item.end);

  const formattedStart = isAllDayEvent
    ? "All day"
    : eventStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formattedEnd = isAllDayEvent
    ? ""
    : `to ${eventEnd.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

  const backgroundColor =
    colorScheme === "dark" ? Colours.dark.itemBackground : Colours.light.itemBackground;
  const textColor = colorScheme === "dark" ? "#FFF" : "#333";
  const timeColor = colorScheme === "dark" ? "#BBB" : "#777";
  const chevronColor =
    colorScheme === "dark" ? Colours.dark.chevronColor : Colours.light.chevronColor;

  const eventColorMap = new Map<string, string>([
    ["youth", Colours.event.youth],
    ["weekly", Colours.event.weekly],
    ["church", Colours.event.church],
    ["family", Colours.event.family],
    ["ladies", Colours.event.ladies],
    ["parish", Colours.event.parish],
    ["seniors", Colours.event.seniors],
    ["playgroup", Colours.event.playgroup],
    ["fellowship", Colours.event.fellowship],
  ]);

  const getEventColor = (source: string) => eventColorMap.get(source) || "#000";

  const sourceColor = getEventColor(item.source) || Colours.light.secondary;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        router.push({
          pathname: "/eventDetails",
          params: { ...item, start: formattedStart, end: formattedEnd },
        });
        onPress();
      }}
      style={[styles.item, { backgroundColor }]}
    >
      <View style={styles.leftBarContainer}>
        <View style={[styles.leftBar, { backgroundColor: sourceColor }]} />
        <View style={styles.itemContent}>
          <View style={styles.textContainer}>
            <Text style={[styles.itemTime, { color: timeColor }]}>
              {formattedStart} {formattedEnd}
            </Text>
            <Text style={[styles.itemTitle, { color: textColor }]}>{item.title}</Text>
          </View>
          <View style={styles.rightIcons}>
            <TouchableOpacity
              onPress={toggleFavorite}
              style={styles.favoriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={isFavorite ? "star" : "star-outline"}
                size={24}
                color={isFavorite ? "#FFD700" : chevronColor}
              />
            </TouchableOpacity>

            <Icon
              name="chevron-forward"
              size={20}
              color={chevronColor}
              style={styles.chevronIcon}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    padding: 20,
    marginVertical: 2,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftBar: {
    width: 8,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopRightRadius: 1,
    borderBottomLeftRadius: 1,
    marginRight: 10,
  },
  leftBarContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    flex: 1,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  itemTime: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 18,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteButton: {
    marginRight: 12,
    padding: 4,
  },
});
