import React, { useState, useEffect } from "react";
import { ItemProps } from "@/types/global";
import { useRouter } from "expo-router";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colours } from "@/styles/Colours";
import { FAVOURITES_KEY } from "@/constants/consts";

export const EventItem = ({
  item,
  onPress,
  onUnfavourite,
  showFullDate = false, // <-- new prop, default is false
}: ItemProps & { onUnfavourite?: () => void; showFullDate?: boolean }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const styles = getStyles();

  const [isFavourite, setIsFavourite] = useState(false);

  // Load favourite status on mount
  useEffect(() => {
    const loadFavourite = async () => {
      try {
        const storedFavourites = await AsyncStorage.getItem(FAVOURITES_KEY);
        if (storedFavourites) {
          const favourites = JSON.parse(storedFavourites);
          // Use unique key - here assume item.id or fallback to title
          const key = item.id ?? item.title;
          setIsFavourite(!!favourites[key]);
        }
      } catch (e) {
        console.error("Failed to load favourites", e);
      }
    };
    loadFavourite();
  }, [item]);

  // Toggle favourite and save state
  const toggleFavourite = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const storedFavourites = await AsyncStorage.getItem(FAVOURITES_KEY);
      const favourites = storedFavourites ? JSON.parse(storedFavourites) : {};
      const key = item.id ?? item.title;

      const newStatus = !isFavourite;

      if (newStatus) {
        favourites[key] = item;
      } else {
        delete favourites[key];
      }

      await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
      setIsFavourite(newStatus);

      if (!newStatus && onUnfavourite) {
        onUnfavourite(); // ← callback to remove from list
      }
    } catch (e) {
      console.error("Failed to save favourite", e);
    }
  };

  const isAllDayEvent = item.start && !item.start.includes("T");
  const eventStart = new Date(item.start);
  const eventEnd = new Date(item.end);
  const formattedDate = eventStart.toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

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
    colorScheme === "dark"
      ? Colours.dark.itemBackground
      : Colours.light.itemBackground;
  const textColor = colorScheme === "dark" ? "#FFF" : "#333";
  const timeColor = colorScheme === "dark" ? "#BBB" : "#777";
  const chevronColor =
    colorScheme === "dark"
      ? Colours.dark.chevronColor
      : Colours.light.chevronColor;

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
            {showFullDate && (
              <Text style={[styles.itemDate, { color: timeColor }]}>
                {formattedDate}
              </Text>
            )}
            <Text style={[styles.itemTime, { color: timeColor }]}>
              {formattedStart} {formattedEnd}
            </Text>
            <Text style={[styles.itemTitle, { color: textColor }]}>
              {item.title}
            </Text>
          </View>
          <View style={styles.rightIcons}>
            <TouchableOpacity
              onPress={toggleFavourite}
              style={styles.favouriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={isFavourite ? "star" : "star-outline"}
                style={styles.icon}
                color={isFavourite ? "#FFD700" : chevronColor}
              />
            </TouchableOpacity>

            <Icon
              name="chevron-forward"
              color={chevronColor}
              style={styles.chevronIcon}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = () =>
  StyleSheet.create({
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
    itemDate: {
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 2,
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
      fontSize: 36,
    },
    rightIcons: {
      flexDirection: "row",
      alignItems: "center",
    },
    favouriteButton: {
      marginRight: 12,
      padding: 4,
    },
    icon: {
      fontSize: 36,
    }
  });
