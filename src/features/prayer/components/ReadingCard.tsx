import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { fontSize, getCommonStyles } from "@/theme/commonStyles";
import { typography } from "@/theme/typography";
import type { DailyReadingsParams } from "@/types/routes";
import he from "he";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import toTitleCase from "titlecase";
import { styles } from "../prayerStyles";
import DropCapText from "./DropCapText";
import type { Reading } from "../services";

type Props = {
  reading: Reading;
  // A small heading above the title, e.g. "The Epistle".
  label?: string;
};

// A card showing a reading's title and teaser. Tapping it opens the full text.
export default function ReadingCard({ reading, label }: Props): JSX.Element {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(
    colorScheme === "dark" ? "dark" : "light",
  );
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[
        styles.contentSection,
        {
          flex: 1,
          margin: 20,
          backgroundColor: theme.itemBackground,
        },
      ]}
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({
          pathname: "/dailyReadings",
          params: {
            type: reading.kind,
            reading: reading.fullText,
            title: reading.title,
          } satisfies DailyReadingsParams,
        });
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          {label ? (
            <Text
              testID="reading-label"
              style={[
                typography.readingLabel,
                { color: theme.commemorate, marginBottom: 4 },
              ]}
            >
              {label}
            </Text>
          ) : null}
          <Text style={[CommonStyles.sectionTitle, typography.readingTitle]}>
            {toTitleCase(reading.title.toLowerCase())}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={fontSize.icon}
          color={theme.chevronColor}
          style={styles.chevronIcon}
        />
      </View>
      <View
        testID="reading-divider"
        style={[styles.divider, { backgroundColor: theme.secondary }]}
      />
      <View style={{ paddingBottom: 20 }}>
        <DropCapText
          text={he.decode(reading.teaser)}
          textStyle={typography.readingTeaser}
          capColour={theme.commemorate}
          textColour={theme.moreImportantText}
        />
      </View>
    </TouchableOpacity>
  );
}
