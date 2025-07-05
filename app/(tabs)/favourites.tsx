import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, useColorScheme, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { getCommonStyles } from '@/styles/CommonStyles';
import { Colours } from '@/styles/Colours';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventItem } from '@/components/EventItem'; // <-- Import your component
import { EventData, ItemProps } from '@/types/global'; // <-- adjust import if needed
import { useFocusEffect } from '@react-navigation/native';
import { FAVOURITES_KEY } from '@/constants/consts';

export default function FavouritesScreen() {
  const [favourites, setFavourites] = useState<ItemProps['item'][]>([]);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  const loadFavourites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVOURITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = new Date();

        const allFavs = Object.values(parsed) as EventData[];

        // Filter out expired items
        const upcomingFavs = allFavs.filter((item) => {
          const itemDate = new Date(item.end); // ensure item.date is a parsable date string or timestamp
          return itemDate > now;
        });

        // Optionally update storage to remove expired ones permanently
        const updatedFavs = Object.fromEntries(
          upcomingFavs.map((item) => [item.id ?? item.title, item])
        );
        await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(updatedFavs));

        setFavourites(upcomingFavs);
      }
    } catch (e) {
      console.error('Failed to load favourites', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavourites();
    }, [])
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={CommonStyles.container}>
        <ScrollView>
          <View style={styles.header}>
            <ThemedText type="title" style={CommonStyles.title}>
              Favourites
            </ThemedText>
            <Text style={styles.subtitle}>
              Saved upcoming events will appear here for quick viewing.
            </Text>
          </View>

          {favourites.length === 0 ? (
            <Text style={{ textAlign: 'center', color: 'gray', marginTop: 20 }}>
              No favourites yet.
            </Text>
          ) : (
            favourites.map((item, index) => (
              <EventItem
                key={item.id ?? `${item.title}-${index}`}
                item={item}
                onPress={() => { }}
                onUnfavourite={() => {
                  setFavourites((prev) =>
                    prev.filter((f) => (f.id ?? f.title) !== (item.id ?? item.title))
                  );
                }}
                showFullDate={true}
              />
            ))
          )}

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/orthodox/Seraph.png')} // Adjust the path to your image
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'grey',
    marginTop: 10,
    marginHorizontal: 26,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 40, // Adjust the space above the image
    marginBottom: 10, // Adjust the space below the image if needed
    flex: 1, // Allows image container to take remaining space
    justifyContent: 'center', // Aligns the image in the middle
  },
  bottomImage: {
    width: 150, // Adjust the width of the image
    height: 150, // Adjust the height of the image
    resizeMode: 'contain', // Ensure the image doesn't get stretched
    marginBottom: 50,
  },
});
