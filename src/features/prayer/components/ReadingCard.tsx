import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { fontSize, getCommonStyles } from "@/theme/commonStyles";
import type { DailyReadingsParams } from "@/types/routes";
import he from "he";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import toTitleCase from "titlecase";
import { styles } from "../prayerStyles";
import type { Reading } from "../services";

type Props = {
  reading: Reading;
  // Colours the divider under the title. Without it the divider is plain.
  accentColour?: string;
};

// A card showing a reading's title and teaser. Tapping it opens the full text.
export default function ReadingCard({
  reading,
  accentColour,
}: Props): JSX.Element {
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
          <Text style={CommonStyles.sectionTitle}>
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
        style={
          accentColour
            ? [styles.divider, { backgroundColor: accentColour }, { height: 3 }]
            : styles.divider
        }
      />
      <Text
        style={[
          { color: theme.moreImportantText },
          { paddingBottom: 20 },
          { fontSize: fontSize.body },
        ]}
      >
        {he.decode(reading.teaser)}
      </Text>
    </TouchableOpacity>
  );
}
