import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import he from "he";
import toTitleCase from "titlecase";
import { Colours } from "@/styles/Colours";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

// Define the expected route params type
type ReadingScreenRouteParams = {
  type: "epistle" | "gospel";
  reading: string;
  title: string;
};

export default function ReadingScreen() {
  const route =
    useRoute<RouteProp<Record<string, ReadingScreenRouteParams>, string>>();
  const { params } = route;
  const { reading, title } = params;
  const navigation = useNavigation();

  const styles = getStyles();

  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Colours.dark : Colours.light;

  useEffect(() => {
    navigation.setOptions({
      title: "Daily Readings",
      headerBackTitle: "Back",
      headerBackTitleStyle: {
        color: "pink", // Set the color of the back button title (if any)
      },
    });
  }, [navigation, title]);

  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    await Clipboard.setStringAsync(
      he.decode(reading) + "\n\n" + "- " + toTitleCase(title.toLowerCase())
    );
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Reset the "Copied!" state when the screen loses focus
  useFocusEffect(
    useCallback(() => {
      setCopied(false); // Reset copied state when the screen is focused
    }, [])
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}
      >
        <Text style={[styles.title, { color: colors.moreImportantText }]}>
          {toTitleCase(title.toLowerCase())}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.detail }]} />

        {/* Put this outside the ScrollView if you can */}
        {/* Or at least above the Text */}
        <TextInput
          value={he.decode(reading)}
          editable={false}
          multiline
          scrollEnabled={false}
          style={[
            styles.text,
            {
              color: colors.moreImportantText,
              padding: 0,
              margin: 0,
              borderWidth: 0, // removes border styling
            },
          ]}
        />
      </ScrollView>

      <TouchableOpacity
        onPress={handleCopyAll}
        style={[
          styles.copyButton,
          { backgroundColor: colors.primary || "#007AFF" },
        ]}
      >
        <Text style={styles.copyButtonText}>{copied ? "Copied!" : "Copy"}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      paddingTop: 10, // Small top padding to avoid text sticking to the top
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 10,
    },
    divider: {
      height: 2,
      marginVertical: 10,
      width: "80%",
      alignSelf: "center",
    },
    text: {
      fontSize: 18,
      lineHeight: 26,
      textAlign: "justify",
    },
    copyButton: {
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 20,
      alignSelf: "center",
      marginVertical: 10,
    },
    copyButtonText: {
      color: "white",
      fontWeight: "600",
      fontSize: 16,
    },
  });
