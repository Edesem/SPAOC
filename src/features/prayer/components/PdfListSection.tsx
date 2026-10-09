import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { getCommonStyles } from "@/theme/commonStyles";
import { typography } from "@/theme/typography";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import type { PdfEntry } from "../catalogue";
import { openPdf, openServicePdf } from "../openServicePdf";
import { styles } from "../prayerStyles";

type Props = {
  heading: string;
  entries: PdfEntry[];
  // Warn the user to silence their phone before an entry opens.
  silencePhone?: boolean;
};

// A card with a heading and one row per PDF.
export default function PdfListSection({
  heading,
  entries,
  silencePhone = false,
}: Props): JSX.Element {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(
    colorScheme === "dark" ? "dark" : "light",
  );
  const router = useRouter();
  const open = silencePhone ? openServicePdf : openPdf;

  return (
    <View
      style={[styles.contentSection, { backgroundColor: theme.itemBackground }]}
    >
      <Text style={[CommonStyles.sectionTitle, typography.readingTitle]}>
        {heading}
      </Text>
      <View style={[styles.divider, { backgroundColor: theme.separator }]} />

      {entries.map((entry) => (
        <TouchableOpacity
          key={entry.title}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            open(router, { url: entry.url, title: entry.title });
          }}
          activeOpacity={0.6}
          accessibilityRole="button"
        >
          <View style={styles.rowContainer}>
            <FontAwesomeIcon
              icon={entry.icon}
              size={35}
              color={theme.moreImportantText}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text
                style={[styles.prayerTitle, { color: theme.moreImportantText }]}
              >
                {entry.title}
              </Text>
              <Text
                style={[
                  styles.prayerSubtitle,
                  { color: theme.lessImportantText },
                ]}
              >
                {entry.subtitle}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
