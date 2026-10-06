import React from "react";
import { ItemProps } from "../types";
import { useRouter } from "expo-router";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { getCalendarColour } from "@/domain/calendarSources";
import { APP_TIME_ZONE } from "@/lib/parishTime";
import { Colours } from "@/theme/colours";
import { formatEventTimes } from "../domain/eventTimes";
import { toEventDetailsParams } from "../domain/routeParams";
import { favouriteKey, useFavouritesStore } from "../favourites";

export const EventItem = ({
  item,
  onPress,
  onUnfavourite,
  showFullDate = false, // <-- new prop, default is false
}: ItemProps & { onUnfavourite?: () => void; showFullDate?: boolean }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const styles = getStyles();

  // Subscribes to just this event's star, so toggling one row re-renders only
  // that row.
  const isFavourite = useFavouritesStore(
    (state) => favouriteKey(item) in state.favourites,
  );

  // Toggle favourite and save state
  const toggleFavourite = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newStatus = await useFavouritesStore.getState().toggle(item);

      if (!newStatus && onUnfavourite) {
        onUnfavourite(); // ← callback to remove from list
      }
    } catch (e) {
      console.error("Failed to save favourite", e);
    }
  };

  const eventStart = new Date(item.start);
  const formattedDate = eventStart.toLocaleDateString([], {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const { start: formattedStart, end: formattedEnd } = formatEventTimes(
    item.start,
    item.end,
    item.allDay,
  );

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

  const sourceColor = getCalendarColour(item.source);

  // VoiceOver and TalkBack read the whole row as one button, and an iOS
  // screen reader can't reach the star nested inside it, so the star is also
  // offered as a custom action on the row.
  const favouriteLabel = isFavourite
    ? `Remove ${item.title} from favourites`
    : `Add ${item.title} to favourites`;
  const rowLabel = [
    item.title,
    showFullDate ? formattedDate : undefined,
    `${formattedStart} ${formattedEnd}`.trim(),
    `${item.source} calendar`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        router.push({
          pathname: "/eventDetails",
          params: toEventDetailsParams(item),
        });
        onPress();
      }}
      style={[styles.item, { backgroundColor }]}
      accessibilityRole="button"
      accessibilityLabel={rowLabel}
      accessibilityHint="Opens event details"
      accessibilityValue={isFavourite ? { text: "Favourite" } : undefined}
      accessibilityActions={[
        { name: "toggleFavourite", label: favouriteLabel },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "toggleFavourite") {
          toggleFavourite();
        }
      }}
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
              accessibilityRole="button"
              accessibilityLabel={favouriteLabel}
              accessibilityState={{ selected: isFavourite }}
            >
              <Icon
                name={isFavourite ? "star" : "star-outline"}
                size={24}
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
    },
  });
