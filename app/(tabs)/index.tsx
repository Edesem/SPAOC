import React from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  SectionList,
  StatusBar,
  Text,
  ActivityIndicator,
  useColorScheme,
  Image
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEvents } from '@/hooks/useEvents';
import { renderItem } from '@/components/RenderItem';
import { Colours } from '@/styles/Colours';
import 'expo-dev-client';

export default function HomeScreen() {
  const { groupedEvents, loading } = useEvents();

  const colorScheme = useColorScheme();  // Get the current system theme (light or dark)
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;

  const sectionsWithUpcoming = [
    {
      title: "Top Image",
      data: [],
    },
    {
      title: "Saint of the Day",
      data: [],
    },
    ...groupedEvents,
    {
      title: "Bottom Image",
      data: [],
    },
  ];

  const SectionHeader = ({ section }: { section: any }) => {
    return section.title === 'Top Image' ? (
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/orthodox/Cross.png')}
          style={[styles.topImage, { tintColor: theme.primary }]} // Using Theme.primary here
        />
      </View>
    ) : section.title === 'Saint of the Day' ? (
      <View style={styles.saintOfTheDayContainer}>
        {/* Display Fast Day information above the saint */}
        <Text style={[styles.fastDayText, { color: theme.detail }]}>Fast Day</Text>
        <Text style={[styles.saintOfTheDayTitle, { color: theme.moreImportantText }]}>Today's Saint:</Text>
        <Text style={[styles.saintOfTheDayTitle, { color: theme.moreImportantText }]}>Saint John Chrysostom</Text>
      </View>
    ) : section.title === 'Bottom Image' ? (
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/orthodox/Seraph.png')}
          style={[styles.bottomImage, { tintColor: theme.primary }]} // Using Theme.primary here
        />
      </View>
    ) : (
      <>
        {section.weekLabel && (
          <Text style={[styles.weekLabel, { backgroundColor: theme.background, color: theme.moreImportantText }]}>
            {section.weekLabel}
          </Text>
        )}
        <Text style={[styles.sectionHeader, { color: theme.sectionDate }]}>{section.title}</Text>
      </>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.verticalBarContainer}>
          <View style={[styles.verticalBar, { backgroundColor: theme.secondary }]} />
          <View style={styles.container}>
            {loading ? (
              <ActivityIndicator size="large" color="#4f4f5b" />
            ) : (
              <SectionList
                sections={sectionsWithUpcoming}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={SectionHeader}
                ListEmptyComponent={<Text style={[styles.emptyMessage, { color: theme.detail }]}>No events found.</Text>}
                stickySectionHeadersEnabled={false} // Disable sticky headers
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
    marginBottom: 10,
  },
  verticalBarContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  verticalBar: {
    width: 7,
    borderRadius: 10,
    marginLeft: 10,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: 20,
  },
  topImage: {
    width: 50,  // Adjust the width of the image
    height: 50, // Adjust the height of the image
    resizeMode: 'contain', // Ensure the image doesn't get stretched
  },
  bottomImage: {
    width: 100,   // Adjust the width of the image
    height: 250,  // Adjust the height of the image
    resizeMode: 'contain', // Ensure the image doesn't get stretched
    paddingBottom: 50,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  saintOfTheDayContainer: {
    padding: 15,
    alignItems: 'center',
  },
  saintOfTheDayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  fastDayText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'red',  // You can customize the color for Fast Day text
  },
  weekLabel: {
    marginLeft: 20,
    marginTop: 15,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginLeft: 15,
    marginTop: 10,
    padding: 5,
    fontSize: 18,
  },
});
