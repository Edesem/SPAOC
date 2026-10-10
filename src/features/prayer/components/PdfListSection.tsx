import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import type { PdfEntry } from "../catalogue";
import { openPdf, openServicePdf } from "../openServicePdf";
import { styles } from "../prayerStyles";
import PrayerRow from "./PrayerRow";

type Props = {
  heading: string;
  entries: PdfEntry[];
  // Warn the user to silence their phone before an entry opens.
  silencePhone?: boolean;
};

// A serif heading with one row card per PDF.
export default function PdfListSection({
  heading,
  entries,
  silencePhone = false,
}: Props): JSX.Element {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const router = useRouter();
  const open = silencePhone ? openServicePdf : openPdf;

  return (
    <View>
      <Text
        accessibilityRole="header"
        style={[styles.sectionHeading, { color: theme.moreImportantText }]}
      >
        {heading}
      </Text>

      {entries.map((entry) => (
        <PrayerRow
          key={entry.title}
          title={entry.title}
          subtitle={entry.subtitle}
          icon={entry.icon}
          onPress={() => open(router, { url: entry.url, title: entry.title })}
        />
      ))}
    </View>
  );
}
