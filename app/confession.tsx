// screens/EventDetailsScreen.js
import { EventData } from '@/global';
import { Colours } from '@/styles/Colours';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import WebView from 'react-native-webview';

const EventDetailsScreen = () => {
  const navigation = useNavigation();
  //const { title, start, end, description, location } = useLocalSearchParams<EventData>();

  const calendlyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
        <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
      </head>
      <body>
        <script type="text/javascript">
          window.onload = function() {
            Calendly.initBadgeWidget({
              url: 'https://calendly.com/inspectre-pi/30min',
              text: 'Schedule time with me',
              color: '#0069ff',
              textColor: '#ffffff',
            });
          }
        </script>
      </body>
      </html>
    `;


  useEffect(() => {
    navigation.setOptions({
      title: 'Book Confession',
    });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <WebView
          originWhitelist={['*']}
          source={{ html: calendlyHtml }}
          style={{ height: 400 }}
        />
      </View>
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/images/orthodox/transfiguration.png')}  // Adjust the path to your local image
          style={styles.bottomImage}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Colours.light.background,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  date: {
    fontSize: 16,
    color: '#555',
    marginVertical: 4,
  },
  detail: {
    fontSize: 16,
    color: '#555',
    marginVertical: 4,
  },
  description: {
    fontSize: 14,
    color: '#777',
    marginTop: 15,
    lineHeight: 20,
  },
  bottomImage: {
    width: 450,   // Adjust the width of the image
    height: 450,  // Adjust the height of the image
    resizeMode: 'contain', // Ensure the image doesn't get stretched
    tintColor: '#0a4068',
    marginBottom: 50,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
});

export default EventDetailsScreen;
