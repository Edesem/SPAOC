// PdfViewer.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { NativeModules } from 'react-native';
console.log(NativeModules);

import Pdf from 'react-native-pdf';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function PdfViewer() {
  const route = useRoute();
  const { url, title } = route.params as { url: string };
  const navigation = useNavigation();

  const source = { uri: url, cache: true }

  useEffect(() => {
    navigation.setOptions({
      title: `${title}`,
      headerBackTitle: 'Back',
      headerBackTitleStyle: {
        color: 'pink', // Set the color of the back button title (if any)
      },
    });
    console.log("PDF URL:", url)

  }, [navigation, title]);

  return (
    <View style={styles.container}>
    <Pdf
        source={source}
        onLoadComplete={(numberOfPages,filePath) => {
            console.log(`Number of pages: ${numberOfPages}`);
        }}
        onPageChanged={(page,numberOfPages) => {
            console.log(`Current page: ${page}`);
        }}
        onError={(error) => {
            console.log(error);
        }}
        onPressLink={(uri) => {
            console.log(`Link pressed: ${uri}`);
        }}
        style={styles.pdf}/>
</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 25,
},
  pdf: {
    flex:1,
    width:Dimensions.get('window').width,
    height:Dimensions.get('window').height,
}
});
