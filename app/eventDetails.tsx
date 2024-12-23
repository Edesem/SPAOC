import { EventData } from '@/global';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, SafeAreaView, useColorScheme, Linking, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from 'react-native';
import { Colours } from '@/styles/Colours';
import { decode } from 'html-entities';

const cleanDescription = (description: string): string => {
  const decoded = decode(description);

  const cleaned = decoded.replace(/<[^>]+>/g, '');

  return cleaned;
};

const renderDescription = (description: string | null, theme: any) => {
  if (!description) return null;

  const cleanedDescription = cleanDescription(description);

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = cleanedDescription.split(urlRegex);

  return (
    <Text style={[styles.description, { color: theme.detail }]}>
      {parts.map((part, index) =>
        urlRegex.test(part) ? (
          <Text
            key={index}
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};

const EventDetailsScreen = () => {
  const navigation = useNavigation();
  const { title, start, end, description, location } = useLocalSearchParams<EventData>();

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;

  useEffect(() => {
    navigation.setOptions({
      title: 'Event Details',
      headerBackTitle: 'Back',
      headerBackTitleStyle: {
        color: 'pink', // Set the color of the back button title (if any)
      },
    });
  }, [navigation, title]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.card, { backgroundColor: theme.itemBackground }]}>
            <Text style={[styles.title, { color: theme.moreImportantText }]}>{title || "Event Title"}</Text>
            <View style={styles.divider} />
            <Text style={[styles.date, { color: theme.lessImportantText }]}>🕒 {start} {end}</Text>
            {location == null
              ? null
              : <Text style={[styles.detail, { color: theme.lessImportantText }]}>📍{location}</Text>
            }
            {description == null
              ? null
              : renderDescription(description, theme)
            }

          </View>
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/images/orthodox/Theotokos.png')}  // Adjust the path to your local image
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F4F4F4',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
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
  customBack: {
    fontSize: 20,
    color: '#0a4068',
    marginLeft: 10,
  },
});

export default EventDetailsScreen;
