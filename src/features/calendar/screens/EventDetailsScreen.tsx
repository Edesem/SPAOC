import CalendarMarker from "@/components/CalendarMarker";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useToolbarIcon } from "@/components/ui/useToolbarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { getCalendarColour, getCalendarImage } from "@/domain/calendarSources";
import { Colours } from "@/theme/colours";
import { typography } from "@/theme/typography";
import { EventDetailsParams } from "@/types/routes";
import { splitDescription } from "../domain/descriptionLinks";
import { favouriteKey, useFavouritesStore } from "../favourites";
import { formatEventDate, formatEventTimeRange } from "../domain/eventTimes";
import { parseEventDetailsParams } from "../domain/routeParams";
import type { EventData } from "../types";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { decode } from "html-entities";
import { ReactNode, useEffect } from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// The closing ornament is sized from the live window (so it follows rotation
// and Split View) but capped so it doesn't balloon on a tablet.
const MAX_IMAGE_SIZE = 480;

const cleanDescription = (description: string): string => {
  const decoded = decode(description);

  const cleaned = decoded.replace(/<[^>]+>/g, "");

  return cleaned;
};

const renderDescription = (description: string, theme: any) => {
  const styles = getStyles();

  const cleanedDescription = cleanDescription(description);

  return (
    <Text style={[styles.description, { color: theme.detail }]}>
      {splitDescription(cleanedDescription).map((part, index) =>
        part.kind === "link" ? (
          <Text
            key={index}
            style={{ color: theme.primary, textDecorationLine: "underline" }}
            accessibilityRole="link"
            accessibilityLabel={`Open link to ${part.label}`}
            onPress={() => Linking.openURL(part.url)}
          >
            {part.label}
          </Text>
        ) : (
          part.text
        ),
      )}
    </Text>
  );
};

// An icon beside a row of text. The row's text says everything the icon does.
const RowIcon = ({ children }: { children: ReactNode }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    {children}
  </View>
);

const EventDetailsScreen = () => {
  const navigation = useNavigation();
  const { id, title, start, end, allDay, description, location, source } =
    parseEventDetailsParams(useLocalSearchParams<EventDetailsParams>());
  const timeLabel = formatEventTimeRange(start, end, allDay);
  const dateLabel = formatEventDate(start, end, allDay);
  const eventTitle = title || "Untitled event";

  const styles = getStyles();

  const gutter = useReadableGutter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const imageWidth = Math.min(windowWidth - gutter * 2, MAX_IMAGE_SIZE);
  const imageHeight = Math.min(windowHeight * 0.5, MAX_IMAGE_SIZE);

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const hairline = { borderTopColor: theme.separator };

  const image = getCalendarImage(source);

  // The same record the event list saves, so the star here and the star on the
  // row always agree.
  const event: EventData = {
    id,
    title,
    start,
    end,
    allDay,
    description: description ?? "",
    location: location ?? "",
    source: source as EventData["source"],
  };
  const isFavourite = useFavouritesStore(
    (state) => favouriteKey(event) in state.favourites,
  );
  const favouriteLabel = isFavourite
    ? `Remove ${eventTitle} from favourites`
    : `Add ${eventTitle} to favourites`;
  const favouriteIcon = useToolbarIcon(
    isFavourite ? "star.fill" : "star",
    isFavourite ? "star" : "star-border",
    isFavourite ? theme.favourite : theme.lessImportantText,
  );

  const toggleFavourite = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await useFavouritesStore.getState().toggle(event);
    } catch (e) {
      console.error("Failed to save favourite", e);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: "Event Details",
      headerBackTitle: "Back",
    });
  }, [navigation, title]);

  const copyLocation = () => {
    if (location) {
      Clipboard.setStringAsync(location);

      Toast.show({
        type: "success",
        text1: "Address copied!",
        visibilityTime: 1500, // duration in ms
      });
    }
  };

  const openInMaps = async () => {
    if (!location) return;

    const encodedQuery = encodeURIComponent(location);

    // First try Waze
    if (await Linking.canOpenURL("waze://")) {
      return Linking.openURL(`waze://?q=${encodedQuery}&navigate=yes`);
    }

    // Next try Google Maps
    if (await Linking.canOpenURL("comgooglemaps://")) {
      return Linking.openURL(`comgooglemaps://?q=${encodedQuery}`);
    }

    // Fallback to system default
    const fallbackUrl = Platform.select({
      ios: `http://maps.apple.com/?q=${encodedQuery}`,
      android: `geo:0,0?q=${encodedQuery}`,
    });

    if (fallbackUrl) {
      try {
        return await Linking.openURL(fallbackUrl);
      } catch (err) {
        console.error("Failed to open fallback map URL:", err);
      }
    }
  };

  const pill = [
    styles.pill,
    { borderColor: theme.secondary, backgroundColor: theme.itemBackground },
  ];

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={favouriteIcon}
          tintColor={isFavourite ? theme.favourite : theme.lessImportantText}
          accessibilityLabel={favouriteLabel}
          onPress={toggleFavourite}
        />
      </Stack.Toolbar>

      {/* The scroll view is the screen's first view so the system can fade it
          under the glass header and inset it below the bar. */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{
          padding: 20,
          paddingHorizontal: 20 + gutter,
          paddingBottom: 0,
          backgroundColor: theme.background,
        }}
      >
        <View style={styles.dateRow}>
          <CalendarMarker colour={getCalendarColour(source)} height={14} />
          <Text style={[styles.date, { color: theme.commemorate }]}>
            {dateLabel}
          </Text>
        </View>
        <Text style={[styles.title, { color: theme.moreImportantText }]}>
          {eventTitle}
        </Text>

        <View style={[styles.section, styles.row, hairline]}>
          <RowIcon>
            <IconSymbol name="clock" size={24} color={theme.secondary} />
          </RowIcon>
          <Text style={[styles.text, { color: theme.moreImportantText }]}>
            {timeLabel}
          </Text>
        </View>

        {location ? (
          <View style={[styles.section, styles.row, styles.top, hairline]}>
            <RowIcon>
              <IconSymbol name="mappin" size={24} color={theme.secondary} />
            </RowIcon>
            <View style={styles.column}>
              <Text style={[styles.text, { color: theme.moreImportantText }]}>
                {location}
              </Text>
              <View style={styles.pills}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    openInMaps();
                  }}
                  style={pill}
                  accessibilityRole="button"
                  accessibilityLabel="Directions"
                >
                  <IconSymbol name="map" size={20} color={theme.secondary} />
                  <Text
                    style={[
                      styles.pillLabel,
                      { color: theme.moreImportantText },
                    ]}
                  >
                    Directions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    copyLocation();
                  }}
                  style={pill}
                  accessibilityRole="button"
                  accessibilityLabel="Copy address"
                >
                  <IconSymbol
                    name="doc.on.doc"
                    size={20}
                    color={theme.secondary}
                  />
                  <Text
                    style={[
                      styles.pillLabel,
                      { color: theme.moreImportantText },
                    ]}
                  >
                    Copy address
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {description ? (
          <View style={[styles.section, hairline]}>
            {renderDescription(description, theme)}
          </View>
        ) : null}

        <View style={[styles.imageContainer, hairline]}>
          <Image
            testID="event-image"
            source={image} // Adjust the path to your local image
            style={[
              styles.bottomImage,
              {
                width: imageWidth,
                height: imageHeight,
                tintColor: theme.primary,
              },
            ]}
          />
        </View>
      </ScrollView>
    </>
  );
};

const getStyles = () =>
  StyleSheet.create({
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    date: {
      ...typography.readingLabel,
      flex: 1,
    },
    title: {
      ...typography.displayTitle,
      marginTop: 4,
      marginBottom: 20,
    },
    // Each block of the page sits under a hairline, as a ruled list would.
    section: {
      borderTopWidth: 1,
      paddingVertical: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    top: {
      alignItems: "flex-start",
    },
    column: {
      flex: 1,
      gap: 12,
    },
    text: {
      ...typography.body,
      flex: 1,
    },
    pills: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    // 48 covers iOS's 44pt and Android's 48dp minimum targets.
    pill: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderRadius: 24,
    },
    pillLabel: {
      ...typography.bodyStrong,
    },
    description: {
      ...typography.body,
    },
    bottomImage: {
      resizeMode: "contain", // Ensure the image doesn't stretch
      marginBottom: 50,
    },
    imageContainer: {
      alignItems: "center",
      paddingTop: 16,
      borderTopWidth: 1,
    },
  });

export default EventDetailsScreen;
