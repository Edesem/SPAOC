import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getCalendarImage } from "@/domain/calendarSources";
import { Colours } from "@/theme/colours";
import { EventDetailsParams } from "@/types/routes";
import { formatEventTimes } from "../domain/eventTimes";
import { parseEventDetailsParams } from "../domain/routeParams";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { decode } from "html-entities";
import { useEffect } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

const cleanDescription = (description: string): string => {
  const decoded = decode(description);

  const cleaned = decoded.replace(/<[^>]+>/g, "");

  return cleaned;
};

const renderDescription = (description: string | null, theme: any) => {
  if (!description) return null;

  const styles = getStyles();

  const cleanedDescription = cleanDescription(description);

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = cleanedDescription.split(urlRegex);

  return (
    <Text style={[styles.description, { color: theme.detail }]}>
      {parts.map((part, index) =>
        urlRegex.test(part) ? (
          <Text
            key={index}
            style={{ color: theme.primary, textDecorationLine: "underline" }}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        ) : (
          part
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

  const styles = getStyles();

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;

  const image = getCalendarImage(source);

  useEffect(() => {
    navigation.setOptions({
      title: "Event Details",
      headerBackTitle: "Back",
      headerBackTitleStyle: {
        color: "pink", // Set the color of the back button title (if any)
      },
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
    console.log(Platform.OS);

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
            paddingBottom: 0,
            backgroundColor: theme.background,
          }}
        >
          <View
            style={[styles.card, { backgroundColor: theme.itemBackground }]}
          >
            <Text style={[styles.title, { color: theme.moreImportantText }]}>
              {title || "Event Title"}
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.date, { color: theme.lessImportantText }]}>
              🕒 {startLabel} {endLabel}
            </Text>
            {location == null ? null : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 5,
                }}
              >
                <Text
                  style={[
                    styles.detail,
                    { color: theme.lessImportantText, flexShrink: 1 },
                  ]}
                >
                  📍{location}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    copyLocation();
                  }}
                  style={{ marginLeft: 10 }}
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
                  style={{ marginLeft: 10 }}
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
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const getStyles = () =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: "#F4F4F4",
    },
    card: {
      backgroundColor: "#FFFFFF",
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
      color: "#333",
      marginBottom: 8,
    },
    divider: {
      height: 1,
      backgroundColor: "#E0E0E0",
      marginVertical: 10,
    },
    date: {
      fontSize: 16,
      color: "#555",
      marginVertical: 4,
    },
    detail: {
      fontSize: 16,
      color: "#555",
      marginVertical: 4,
    },
    description: {
      fontSize: 14,
      marginTop: 15,
      lineHeight: 20,
    },
    bottomImage: {
      width: width, // 80% of the screen width
      height: height * 0.5, // 40% of the screen height
      resizeMode: "contain", // Ensure the image doesn't stretch
      tintColor: "#0a4068",
      marginBottom: 50,
    },
    imageContainer: {
      alignItems: "center",
      marginTop: 5,
    },
    customBack: {
      fontSize: 18,
      color: "#0a4068",
      marginLeft: 10,
    },
  });

export default EventDetailsScreen;
