import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useToolbarIcon } from "@/components/ui/useToolbarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useReadableGutter } from "@/hooks/useReadableGutter";
import he from "he";
import toTitleCase from "titlecase";
import { Colours } from "@/theme/colours";
import { typography } from "@/theme/typography";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { DailyReadingsParams } from "@/types/routes";
import DropCapText from "../components/DropCapText";

export default function ReadingScreen() {
  const { reading, title } = useLocalSearchParams<DailyReadingsParams>();
  const navigation = useNavigation();

  const styles = getStyles();

  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? Colours.dark : Colours.light;

  useEffect(() => {
    navigation.setOptions({
      title: "Daily Readings",
      headerBackTitle: "Back",
    });
  }, [navigation, title]);

  const gutter = useReadableGutter();

  const [copied, setCopied] = useState(false);
  const copyIcon = useToolbarIcon(
    copied ? "checkmark" : "doc.on.doc",
    copied ? "check" : "content-copy",
    colors.primary,
  );

  const handleCopyAll = async () => {
    await Clipboard.setStringAsync(
      he.decode(reading) + "\n\n" + "- " + toTitleCase(title.toLowerCase()),
    );
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Reset the "Copied!" state when the screen loses focus
  useFocusEffect(
    useCallback(() => {
      setCopied(false); // Reset copied state when the screen is focused
    }, []),
  );

  return (
    <>
      {/* First view in the screen, so the system fades it under the header. */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: 20 + gutter },
        ]}
      >
        <Text style={[styles.title, { color: colors.moreImportantText }]}>
          {toTitleCase(title.toLowerCase())}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.detail }]} />

        <DropCapText
          text={he.decode(reading)}
          textStyle={styles.text}
          capColour={colors.commemorate}
          textColour={colors.moreImportantText}
          selectable
        />
      </ScrollView>
      {/* A floating glass button on iOS, a Material floating toolbar on Android.
          Last, not first: on Android it is drawn in place over the screen, so
          anything after it in the tree would cover it. */}
      <Stack.Toolbar>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          icon={copyIcon}
          tintColor={colors.primary}
          accessibilityLabel={copied ? "Copied" : "Copy"}
          onPress={handleCopyAll}
        />
      </Stack.Toolbar>
    </>
  );
}
const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      paddingBottom: 120, // Clears the floating copy button
      paddingTop: 10, // Small top padding to avoid text sticking to the top
    },
    title: {
      ...typography.displayTitle,
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
      ...typography.reading,
      textAlign: "justify",
    },
  });
