import { useColorScheme } from "@/hooks/useColorScheme";
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { Colours } from "@/theme/colours";
import { getCommonStyles } from "@/theme/commonStyles";
import { typography } from "@/theme/typography";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ComponentProps } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome5, {
  FontAwesome5IconProps,
} from "react-native-vector-icons/FontAwesome5";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const gutter = useReadableGutter();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  const styles = getStyles();

  const openLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={CommonStyles.container}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 20 + gutter,
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: theme.detail }]}>
          This app is developed for the parishioners of St Paul’s Antiochian
          Orthodox Church. Stay up to date with events, readings, and community
          life.
        </Text>
      </View>

      {/* Links Section */}
      <View style={styles.linksSection}>
        <LinkButton
          icon="public"
          label="Visit our Website"
          onPress={() => openLink("https://stpaulchurch.com.au")}
          color={theme.primary}
        />
        <LinkButton
          icon="store"
          label="Church Store"
          onPress={() => openLink("https://stpaulchurch.org.au/store")}
          color={theme.primary}
        />
        <LinkButton
          icon="facebook"
          label="Follow on Facebook"
          onPress={() =>
            openLink("https://www.facebook.com/StPaulsAntiochianOrthodoxChurch")
          }
          color={theme.primary}
        />
        <LinkButton
          icon="instagram"
          label="Follow on Instagram"
          onPress={() =>
            openLink("https://www.instagram.com/stpaulsdandenong/")
          }
          color={theme.primary}
        />
        <LinkButton
          icon="youtube"
          label="Subscribe on YouTube"
          onPress={() =>
            openLink(
              "https://www.youtube.com/@stpaulsantiochianorthodoxc6010/videos",
            )
          }
          color={theme.primary}
        />
        <LinkButton
          icon="whatsapp"
          label="Join our WhatsApp group"
          onPress={() =>
            openLink("https://chat.whatsapp.com/Lee9DcwOsBvKJhrCveH445")
          }
          color={theme.primary}
        />
        <LinkButton
          icon="spotify"
          label="Listen to our choir on Spotify"
          onPress={() =>
            openLink("https://open.spotify.com/artist/5KSBKd6aPBEeEDzncaLdT7")
          }
          color={theme.primary}
        />
        <LinkButton
          icon="itunes-note"
          label="Listen to our choir on Apple Music"
          onPress={() =>
            openLink(
              "https://music.apple.com/us/artist/st-ephraim-the-syrian-antiochian-orthodox-choir/1785814045",
            )
          }
          color={theme.primary}
        />
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={require("@assets/images/orthodox/star2.png")} // Adjust the path to your image
          style={[styles.bottomImage, { tintColor: theme.primary }]}
        />
      </View>
    </ScrollView>
  );
}

function LinkButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: FontAwesome5IconProps["name"];
  label: string;
  onPress: () => void;
  color: string;
}) {
  const styles = getStyles();

  // Choose the right icon set based on icon name
  const fontAwesomeIcon = [
    "instagram",
    "youtube",
    "whatsapp",
    "spotify",
    "itunes-note",
  ].includes(icon);

  return (
    <TouchableOpacity
      style={styles.linkButton}
      onPress={onPress}
      accessibilityRole="link"
    >
      {fontAwesomeIcon ? (
        <FontAwesome5 name={icon} size={24} color={color} />
      ) : (
        <MaterialIcons
          name={icon as ComponentProps<typeof MaterialIcons>["name"]}
          size={24}
          color={color}
        />
      )}
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
    },
    subtitle: {
      ...typography.aside,
      marginTop: 10,
      textAlign: "center",
      lineHeight: 22,
    },
    linksSection: {
      gap: 16,
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: "transparent",
    },
    linkLabel: {
      ...typography.bodyStrong,
    },
    imageContainer: {
      alignItems: "center",
      marginTop: 40, // Adjust the space above the image
      marginBottom: 10, // Adjust the space below the image if needed
      flex: 1, // Allows image container to take remaining space
      justifyContent: "center", // Aligns the image in the middle
    },
    bottomImage: {
      width: 150, // Adjust the width of the image
      height: 150, // Adjust the height of the image
      resizeMode: "contain", // Ensure the image doesn't get stretched
      marginBottom: 50,
    },
  });
