import { EventData } from "@/types/global";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Linking,
  Platform,
  Dimensions,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colours } from "@/styles/Colours";
import { decode } from "html-entities";
import * as Clipboard from "expo-clipboard";
import { IconSymbol } from "@/components/ui/IconSymbol";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { useFontStyles } from "@/hooks/useFontStyles";

const { width, height } = Dimensions.get("window");

const cleanDescription = (description: string): string => {
  const decoded = decode(description);

  const cleaned = decoded.replace(/<[^>]+>/g, "");

  return cleaned;
};

const renderDescription = (description: string | null, theme: any) => {
  if (!description) return null;

  const font = useFontStyles();
  const styles = getStyles(font);

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
        )
      )}
    </Text>
  );
};

const EventDetailsScreen = () => {
  const navigation = useNavigation();
  const { title, start, end, description, location, source } =
    useLocalSearchParams<EventData>();

  const font = useFontStyles();
  const styles = getStyles(font);

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;

  const imageMap: Record<string, any> = {
    youth: require("../assets/images/orthodox/procession.png"),
    church: require("../assets/images/orthodox/church.png"),
    family: require("../assets/images/orthodox/village.png"),
    ladies: require("../assets/images/orthodox/Theotokos.png"),
    parish: require("../assets/images/orthodox/parish.png"),
    seniors: require("../assets/images/orthodox/icon towel.png"),
    weekly: require("../assets/images/orthodox/icon corner.png"),
    playgroup: require("../assets/images/orthodox/annunciation.png"),
    fellowship: require("../assets/images/orthodox/fellowship.png"),
  };

  // Get the image based on the source or fallback to default
  const image = imageMap[source] || imageMap.default;

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

  const openInMaps = () => {
    if (!location) return;

    const query = encodeURIComponent(location);

    // Try Google Maps first (if available)
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Linking.canOpenURL("comgooglemaps://").then((supported) => {
        if (supported) {
          Linking.openURL(`comgooglemaps://?q=${query}`);
        } else {
          // Fallback to system default map
          const fallbackUrl = Platform.select({
            ios: `http://maps.apple.com/?q=${query}`,
            android: `geo:0,0?q=${query}`,
          });

          if (fallbackUrl) {
            Linking.openURL(fallbackUrl).catch((err) =>
              console.error("Failed to open fallback map URL:", err)
            );
          }
        }
      });
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.background },
          ]}
        >
          <View
            style={[styles.card, { backgroundColor: theme.itemBackground }]}
          >
            <Text style={[styles.title, { color: theme.moreImportantText }]}>
              {title || "Event Title"}
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.date, { color: theme.lessImportantText }]}>
              🕒 {start} {end}
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
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

const getStyles = (font: ReturnType<typeof useFontStyles>) =>
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
      ...font.heading,
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
      ...font.body,
      color: "#555",
      marginVertical: 4,
    },
    detail: {
      ...font.body,
      color: "#555",
      marginVertical: 4,
    },
    description: {
      ...font.small,
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
      ...font.subheading,
      color: "#0a4068",
      marginLeft: 10,
    },
  });

export default EventDetailsScreen;
