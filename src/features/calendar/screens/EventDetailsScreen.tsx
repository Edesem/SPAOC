import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { getCalendarImage } from "@/domain/calendarSources";
import { Colours } from "@/theme/colours";
import { EventDetailsParams } from "@/types/routes";
import { splitDescription } from "../domain/descriptionLinks";
import { formatEventDate, formatEventTimes } from "../domain/eventTimes";
import { parseEventDetailsParams } from "../domain/routeParams";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { decode } from "html-entities";
import { useEffect } from "react";
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
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// The closing ornament is sized from the live window (so it follows rotation
// and Split View) but capped so it doesn't balloon on a tablet.
const MAX_IMAGE_SIZE = 480;

const cleanDescription = (description: string): string => {
  const decoded = decode(description);

  const cleaned = decoded.replace(/<[^>]+>/g, "");

  return cleaned;
};

const renderDescription = (description: string | null, theme: any) => {
  if (!description) return null;

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

const EventDetailsScreen = () => {
  const navigation = useNavigation();
  const { title, start, end, allDay, description, location, source } =
    parseEventDetailsParams(useLocalSearchParams<EventDetailsParams>());
  const { start: startLabel, end: endLabel } = formatEventTimes(
    start,
    end,
    allDay,
  );
  const dateLabel = formatEventDate(start, end, allDay);

  const styles = getStyles();

  const gutter = useReadableGutter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const imageWidth = Math.min(windowWidth - gutter * 2, MAX_IMAGE_SIZE);
  const imageHeight = Math.min(windowHeight * 0.5, MAX_IMAGE_SIZE);

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;

  const image = getCalendarImage(source);

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

    const query = encodeURIComponent(location);
    const encodedQuery = encodeURIComponent(query);

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

  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={[]}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingHorizontal: 20 + gutter,
            paddingBottom: 0,
            backgroundColor: theme.background,
          }}
        >
          <View
            style={[styles.card, { backgroundColor: theme.itemBackground }]}
          >
            <Text style={[styles.title, { color: theme.moreImportantText }]}>
              {title || "Untitled event"}
            </Text>
            <View
              style={[styles.divider, { backgroundColor: theme.separator }]}
            />
            <View style={styles.metaRow}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <IconSymbol
                  name="calendar"
                  size={20}
                  color={theme.lessImportantText}
                />
              </View>
              <Text style={[styles.date, { color: theme.lessImportantText }]}>
                {dateLabel}
              </Text>
            </View>
            <View style={[styles.metaRow, { marginTop: 5 }]}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <IconSymbol
                  name="clock"
                  size={20}
                  color={theme.lessImportantText}
                />
              </View>
              <Text style={[styles.date, { color: theme.lessImportantText }]}>
                {startLabel} {endLabel}
              </Text>
            </View>
            {location == null ? null : (
              <View style={[styles.metaRow, { marginTop: 5 }]}>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <IconSymbol
                    name="mappin"
                    size={20}
                    color={theme.lessImportantText}
                  />
                </View>
                <Text
                  style={[
                    styles.detail,
                    { color: theme.lessImportantText, flex: 1 },
                  ]}
                >
                  {location}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    copyLocation();
                  }}
                  style={styles.locationAction}
                  accessibilityRole="button"
                  accessibilityLabel="Copy address"
                >
                  <IconSymbol
                    name="square.fill.on.square.fill"
                    size={28}
                    color={theme.lessImportantText}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    openInMaps();
                  }}
                  style={styles.locationAction}
                  accessibilityRole="button"
                  accessibilityLabel="Open in maps"
                >
                  <IconSymbol
                    name="map.fill"
                    size={28}
                    color={theme.lessImportantText}
                  />
                </TouchableOpacity>
              </View>
            )}
            {description == null ? (
              <Text style={[styles.description, { color: theme.detail }]}>
                No description available
              </Text>
            ) : (
              renderDescription(description, theme)
            )}
          </View>
          <View style={styles.imageContainer}>
            <Image
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const getStyles = () =>
  StyleSheet.create({
    card: {
      borderRadius: 12,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 8,
    },
    divider: {
      height: 1,
      marginVertical: 10,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    date: {
      fontSize: 16,
      marginVertical: 4,
    },
    detail: {
      fontSize: 16,
      marginVertical: 4,
    },
    description: {
      fontSize: 14,
      marginTop: 15,
      lineHeight: 20,
    },
    // 48 covers iOS's 44pt and Android's 48dp minimum targets.
    locationAction: {
      minWidth: 48,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    bottomImage: {
      resizeMode: "contain", // Ensure the image doesn't stretch
      marginBottom: 50,
    },
    imageContainer: {
      alignItems: "center",
      marginTop: 5,
    },
  });

export default EventDetailsScreen;
