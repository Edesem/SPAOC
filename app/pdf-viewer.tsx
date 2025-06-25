// PdfViewer.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { NativeModules } from 'react-native';
console.log(NativeModules);

import Pdf from 'react-native-pdf';
import { useRoute } from '@react-navigation/native';

export default function PdfViewer() {
  const route = useRoute();
  const { url } = route.params as { url: string };

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: url, cache: true }}
        style={styles.pdf}
        onError={(error) => {
          console.error("PDF load error:", error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
});
