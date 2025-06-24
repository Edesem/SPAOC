import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { getCommonStyles } from '@/styles/CommonStyles';
import { Colours } from '@/styles/Colours';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventItem } from '@/components/EventItem'; // <-- Import your component
import { EventData, ItemProps } from '@/types/global'; // <-- adjust import if needed
import { useFocusEffect } from '@react-navigation/native';

const FAVORITES_KEY = 'favorites';

export default function FavouritesScreen() {
  const [favourites, setFavourites] = useState<ItemProps['item'][]>([]);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  const loadFavourites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const favs = Object.values(parsed) as EventData[];
        setFavourites(favs);
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
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
              Saved events will appear here for quick viewing.
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
              />
            ))
          )}
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
});
