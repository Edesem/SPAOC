import OrnamentalDivider from "@/components/OrnamentalDivider";
import DonateSection from "../components/DonateSection";
import LinkRow from "../components/LinkRow";
import { PARISH_LINKS } from "../constants";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { Colours } from "@/theme/colours";
import { getCommonStyles } from "@/theme/commonStyles";
import { typography } from "@/theme/typography";
import { useRouter } from "expo-router";
import { Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ParishScreen() {
  const insets = useSafeAreaInsets();
  const gutter = useReadableGutter();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  const openScreen = (path: "/help" | "/settings") => {
    router.push(path);
  };

  const headingStyle = [styles.heading, { color: theme.moreImportantText }];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={CommonStyles.container}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: gutter,
      }}
    >
      <Text style={[styles.subtitle, { color: theme.detail }]}>
        This app is developed for the parishioners of St Paul’s Antiochian
        Orthodox Church. Stay up to date with events, readings, and community
        life.
      </Text>

      <OrnamentalDivider
        colour={theme.secondary}
        style={styles.sectionBreak}
      />

      <DonateSection theme={theme} CommonStyles={CommonStyles} />

      <OrnamentalDivider
        colour={theme.secondary}
        style={styles.sectionBreak}
      />

      <Text accessibilityRole="header" style={headingStyle}>
        Connect
      </Text>
      <View>
        {PARISH_LINKS.map(({ label, url, icon, iconSet }) => (
          <LinkRow
            key={url}
            icon={icon}
            iconSet={iconSet}
            label={label}
            onPress={() => openLink(url)}
          />
        ))}
      </View>

      <OrnamentalDivider
        colour={theme.secondary}
        style={styles.sectionBreak}
      />

      <Text accessibilityRole="header" style={headingStyle}>
        The App
      </Text>
      <View>
        <LinkRow
          icon="help-outline"
          label="Help & feedback"
          onPress={() => openScreen("/help")}
          chevron
        />
        <LinkRow
          icon="settings"
          label="Settings"
          onPress={() => openScreen("/settings")}
          chevron
        />
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require("@assets/images/orthodox/star2.png")}
          style={[styles.bottomImage, { tintColor: theme.primary }]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Left-aligned, in line with the large header title above it.
  subtitle: {
    ...typography.subtitle,
    marginTop: 10,
    marginHorizontal: 20,
    textAlign: "left",
  },
  // Lines up with the row cards' 16pt inset, as on Prayer.
  sectionBreak: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  // Lines up with the large header title, like Prayer's section headings.
  heading: {
    ...typography.sectionHeading,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
    textAlign: "left",
  },
  imageContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  bottomImage: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 50,
  },
});
