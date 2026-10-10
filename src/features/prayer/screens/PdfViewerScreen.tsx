import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { PdfViewerParams } from "@/types/routes";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles as prayerStyles } from "../prayerStyles";

// A cached copy is reused for a week, so a text opened once still opens
// offline, yet a file the diocese replaces at the same address is picked up.
const PDF_CACHE_SECONDS = 7 * 24 * 60 * 60;

// react-native-pdf's fit policy: 0 fits the page to the width.
const FIT_WIDTH = 0;

export default function PdfViewer() {
  const { url, title } = useLocalSearchParams<PdfViewerParams>();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  // Landscape puts the notch beside the page, not above it.
  const insets = useSafeAreaInsets();
  const [failed, setFailed] = useState(false);
  // Changing the key makes the native view load the file again.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    navigation.setOptions({
      title: `${title}`,
      headerBackTitle: "Back",
    });
  }, [navigation, title]);

  const retry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFailed(false);
    setAttempt((count) => count + 1);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {failed ? (
        <View style={[prayerStyles.errorBlock, styles.error]}>
          <Text style={[prayerStyles.errorText, { color: theme.error }]}>
            Couldn&apos;t open this PDF
          </Text>
          <TouchableOpacity
            onPress={retry}
            style={[
              prayerStyles.retryButton,
              { backgroundColor: theme.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Try opening this PDF again"
          >
            <Text style={[prayerStyles.retryText, { color: theme.onPrimary }]}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Pdf
          key={attempt}
          source={{ uri: url, cache: true, expiration: PDF_CACHE_SECONDS }}
          style={styles.pdf}
          fitPolicy={FIT_WIDTH}
          // The library defaults this to true, which skips the certificate check.
          trustAllCerts={false}
          renderActivityIndicator={() => (
            <ActivityIndicator size="large" color={theme.primary} />
          )}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
  error: {
    flex: 1,
    justifyContent: "center",
  },
});
