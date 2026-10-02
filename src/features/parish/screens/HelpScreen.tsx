import DonateSection from "../components/DonateSection";
import { ThemedText } from "@/components/ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { getCommonStyles } from "@/theme/commonStyles";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import * as Localization from "expo-localization";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  const styles = getStyles();

  const openMail = (
    type: "Bug" | "Suggestion" | "Support",
    email = "robertlzoltan@gmail.com",
  ) => {
    const version = Constants.expoConfig?.version ?? "unknown";
    const build = Constants.expoConfig?.ios?.buildNumber ?? "N/A";
    const device = Constants.deviceName ?? "unknown";
    const locale = Localization.getLocales()[0]?.languageTag ?? "unknown";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let message = "";
    switch (type) {
      case "Bug":
        message = "Please describe the issue you encountered below:";
        break;
      case "Suggestion":
        message =
          "Thank you for using SPAOC! We’d love to hear your idea or improvement suggestion:";
        break;
      case "Support":
        message = "Let us know how we can help:";
        break;
      default:
        message = "Please write your message below:";
    }

    const subject = encodeURIComponent(`[${type}] (INSERT TITLE)`);
    const body = encodeURIComponent(
      `${message}\n\n` +
        `--- Do not DELETE below ---\nApp Version: ${version}\nPlatform: ${Platform.OS} ${Platform.Version}\n` +
        `Device: ${device}\nBuild: ${build}\nTimezone: ${timezone}\nLocale: ${locale}`,
    );

    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    Linking.openURL(mailtoUrl).catch((err) =>
      console.error("Failed to open email:", err),
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={CommonStyles.container}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20,
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={CommonStyles.title}>
              Help & Support
            </ThemedText>
            <Text style={[styles.subtitle, { color: theme.detail }]}>
              Need help using the app? Explore the options below or reach out
              for support.
            </Text>
          </View>

          {/* Help Links */}
          <View style={styles.section}>
            <LinkItem
              icon="bug-report"
              label="Report a bug"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                openMail("Bug");
              }}
              color={theme.primary}
            />
            <LinkItem
              icon="lightbulb"
              label="Suggest a feature"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                openMail("Suggestion");
              }}
              color={theme.primary}
            />
            <LinkItem
              icon="email"
              label="Contact Support"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                openMail("Support");
              }}
              color={theme.primary}
            />
          </View>

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require("@assets/images/orthodox/ht.png")}
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
          </View>

          <DonateSection theme={theme} CommonStyles={CommonStyles} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function LinkItem({
  icon,
  label,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}) {
  const styles = getStyles();

  return (
    <TouchableOpacity style={styles.linkItem} onPress={onPress}>
      <MaterialIcons name={icon as any} size={24} color={color} />
      <Text style={[styles.linkLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const getStyles = () =>
  StyleSheet.create({
    content: {
      padding: 20,
      gap: 30,
    },
    header: {
      alignItems: "center",
      marginBottom: 10,
      fontSize: 24,
    },
    subtitle: {
      fontSize: 16,
      fontStyle: "italic",
      marginTop: 10,
      textAlign: "center",
      lineHeight: 22,
    },
    section: {
      gap: 16,
    },
    linkItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    linkLabel: {
      fontSize: 16,
      fontWeight: "500",
    },
    versionText: {
      fontSize: 14,
      fontStyle: "italic",
      textAlign: "center",
      marginTop: 20,
      marginBottom: 60,
    },
    bottomImage: {
      width: 100,
      height: 100,
      resizeMode: "contain",
      marginBottom: 50,
      marginTop: 60,
    },
    imageContainer: {
      alignItems: "center",
      marginTop: 10,
      marginBottom: 10,
      justifyContent: "center",
    },
  });
