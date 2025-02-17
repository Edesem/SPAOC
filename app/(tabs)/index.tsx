import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  SectionList,
  StatusBar,
  Text,
  ActivityIndicator,
  useColorScheme,
  Image,
  AppState,
  RefreshControl,
  Button,
  TouchableOpacity
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { renderItem } from '@/components/RenderItem';
import { Colours } from '@/styles/Colours';
import 'expo-dev-client';
import { useFastDay } from '@/hooks/useFastDay';
import * as SplashScreen from 'expo-splash-screen';
import { useDailySaint } from '@/hooks/useDailySaint';
import { useEvents } from '@/hooks/useEvents';
import { requestNotificationPermissions, scheduleNotification, setupNotificationListeners } from '@/notifications';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function HomeScreen() {
  useEffect(() => {
    requestNotificationPermissions();
    setupNotificationListeners();
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colours.dark : Colours.light;

  const { todaysSaints, error, refetchSaints } = useDailySaint();
  const { events, fastLoading, refetch: refetchFast } = useFastDay();
  const { events: allEvents, groupedEvents, loading: eventsLoading, refetch: refetchEvents } = useEvents();

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSaints(), refetchFast(), refetchEvents()]);
    setRefreshing(false);
  };

  let todaysSaintsTitle = "";
  todaysSaints.length > 1 ? todaysSaintsTitle = "Today's Feasts" : todaysSaintsTitle = "Today's Feast:";

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

  console.log(events)

  let majorFastText = null;
  let minorFastText = null;

  if (events.includes("Great Lent")) {
    majorFastText = <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>Great Lent</Text>;
  }
  else if (events.includes("The Apostles' Fast")) {
    majorFastText = <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>The Apostles' Fast</Text>;
  }
  else if (events.includes("Theotokos Fast")) {
    majorFastText = <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>Theotokos Fast</Text>;
  }
  else if (events.includes("The Nativity Fast")) {
    majorFastText = <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>The Nativity Fast</Text>;
  }
  else {
    majorFastText = null
  }

  if (events.includes("Strict Fast")) {
    minorFastText = <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>Abstain from meat, fish, dairy, eggs, wine, olive oil</Text>;
  }
  else if (events.includes("Fast")) {
    minorFastText = <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>Abstain from meat, dairy, eggs</Text>;
  }
  else if (events.includes("Meat Fast")) {
    minorFastText = <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>Abstain from meat</Text>;
  }
  else {
    minorFastText = <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>No Fast</Text>;
  }


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
        <Text style={[styles.saintOfTheDayTitle, { color: theme.moreImportantText }]}>{todaysSaintsTitle}</Text>
        <Text style={[styles.saintOfTheDay, { color: theme.moreImportantText }]}>{todaysSaints.join('\n')}</Text>
        {majorFastText}
        {minorFastText}
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

        {fastLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f4f5b" />
          </View>
        ) :
          <View style={styles.verticalBarContainer}>
            <View style={[styles.verticalBar, { backgroundColor: theme.secondary }]} />

            <View style={styles.container}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 }}>
                {/* Send Test Notification Button on the left */}
                <Button
                  title="Send Test Notification"
                  onPress={() => scheduleNotification('SPAOC', 'Liturgy has started!', new Date(Date.now() + 5000))}
                />

                {/* Hamburger Menu on the right */}
                <TouchableOpacity
                  onPress={() => router.push('/settings')}
                  style={{ padding: 10 }}
                >
                  <MaterialIcons name="menu" size={28} color="black" />
                </TouchableOpacity>
              </View>


              <SectionList
                sections={sectionsWithUpcoming}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={SectionHeader}
                ListEmptyComponent={<Text style={[styles.emptyMessage, { color: theme.detail }]}>No events found.</Text>}
                stickySectionHeadersEnabled={false} // Disable sticky headers
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
                }
              />
            </View>
          </View>
        }
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: 10,
  },
  loadingContainer: {
    justifyContent: 'center',
    paddingVertical: 30,
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
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  bottomImage: {
    width: 100,
    height: 250,
    resizeMode: 'contain',
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  saintOfTheDay: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  MajorFastText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  minorFastText: {
    fontSize: 18,
    textAlign: 'center',
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
