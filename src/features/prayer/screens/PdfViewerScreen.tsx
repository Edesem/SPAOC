// PdfViewer.tsx
import { PdfViewerParams } from "@/types/routes";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

// TODO: Temporary WebView solution - switch back to react-native-pdf when fixed
const USE_WEBVIEW = true; // Set to false when react-native-pdf is working again

export default function PdfViewer() {
  const { url, title } = useLocalSearchParams<PdfViewerParams>();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: `${title}`,
      headerBackTitle: "Back",
    });
  }, [navigation, title, url]);

  if (USE_WEBVIEW) {
    // Temporary WebView implementation
    const webViewUrl =
      Platform.OS === "android"
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`
        : url;

    return (
      <View style={styles.container}>
        <WebView source={{ uri: webViewUrl }} style={styles.pdf} />
      </View>
    );
  }

  // Original react-native-pdf implementation (currently disabled)
  /* KEEP THIS CODE - Uncomment when react-native-pdf is fixed
  const { NativeModules } = require('react-native');
  const Pdf = require('react-native-pdf').default;
  
  const source = { uri: url, cache: true };

  return (
    <View style={styles.container}>
      <Pdf
        source={source}
        style={styles.pdf}
      />
    </View>
  );
  */

  return null; // This line won't be reached when USE_WEBVIEW is true
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  pdf: {
    flex: 1,
    alignSelf: "stretch",
  },
});
