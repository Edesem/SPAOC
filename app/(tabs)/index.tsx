import { renderItem } from "@/components/RenderItem";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme"; // or set up tsconfig to alias
import { useDailySaint } from "@/hooks/useDailySaint";
import { useEvents } from "@/hooks/useEvents";
import { useFastDay } from "@/hooks/useFastDay";
import {
  requestNotificationPermissions,
  setupNotificationListeners,
} from "@/notifications";
import { Colours } from "@/styles/Colours";
import { scheduleSaintNotificationsForNext7Days } from "@/utils/notifications";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import "expo-dev-client";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useNavigation } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  Modal,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MonthPicker from "react-native-month-year-picker";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

interface EventItem {
  start: string;
}

interface EventSection {
  title: string;
  data: EventItem[];
}

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function HomeScreen() {
  const appState = useRef(AppState.currentState);
  const lastRefreshTime = useRef<number | null>(null);
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList, "Home">>();
  const sectionListRef = useRef<SectionList>(null);
  const { todaysSaints, refetchSaints } = useDailySaint();

  const [refreshing, setRefreshing] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const { groupedEvents, refetch: refetchEvents } = useEvents();

  const styles = getStyles();
  const { events, fastLoading, refetch: refetchFast } = useFastDay();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSaints(), refetchFast(), refetchEvents()]);
    setRefreshing(false);
  }, [refetchSaints, refetchFast, refetchEvents]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const now = Date.now();
        if (lastRefreshTime.current === null) {
          lastRefreshTime.current = now;
        }
        const minutesSinceLastRefresh =
          (now - lastRefreshTime.current) / (1000 * 60);

        if (minutesSinceLastRefresh > 300) {
          // 5 hour threshold
          onRefresh();
          lastRefreshTime.current = now;
        }
      }

      appState.current = nextAppState;
    });

    requestNotificationPermissions();
    setupNotificationListeners();

    // Schedule saint notification
    scheduleSaintNotificationsForNext7Days();

    return () => subscription.remove();
  }, [onRefresh]);

  useFocusEffect(
    useCallback(() => {
      refetchEvents(); // this will reload event data and favourite status
    }, [refetchEvents]),
  );

  // Your param list type (adjust to your app)
  type RootTabParamList = {
    Home: undefined;
    // other tabs...
  };

  // Scroll to top when pressing Home tab
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        animated: true,
      });
    });

    return unsubscribe;
  }, [navigation]);

  const filteredSections = useMemo(() => {
    // Initial screen behaviour: show every event section.
    if (!selectedMonth) {
      return groupedEvents;
    }

    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();

    return groupedEvents
      .map((section) => ({
        ...section,
        data: section.data.filter((item) => {
          const itemDate = new Date(item.start);
          return (
            itemDate.getFullYear() === year && itemDate.getMonth() === month
          );
        }),
      }))
      .filter((section) => section.data.length > 0);
  }, [groupedEvents, selectedMonth]);

  const onValueChange = useCallback(
    (event: string, newDate: Date) => {
      if (event === "dateSetAction") {
        const pickedDate = newDate || selectedDate;
        setSelectedDate(pickedDate);
        setSelectedMonth(pickedDate);
      }

      setShowMonthPicker(false);
    },
    [selectedDate],
  );

  const sectionsWithIndex = filteredSections.map((section, index) => ({
    ...section,
    sectionIndex: index,
  }));

  const todaysSaintsTitle =
    todaysSaints.length > 1 ? "Today's Feasts" : "Today's Feast:";

  const sectionsWithUpcoming = [
    {
      title: "Top Image",
      data: [],
    },
    {
      title: "Saint of the Day",
      data: [],
    },
    ...sectionsWithIndex,
    {
      title: "Bottom Image",
      data: [],
    },
  ];

  console.log(events);

  // Fasting Logic
  let majorFastText = null;
  let minorFastText = null;

  if (events.includes("Great Lent")) {
    majorFastText = (
      <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>
        Great Lent
      </Text>
    );
  } else if (events.includes("The Apostles' Fast")) {
    majorFastText = (
      <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>
        The Apostles&apos; Fast
      </Text>
    );
  } else if (events.includes("The Theotokos Fast")) {
    majorFastText = (
      <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>
        Theotokos Fast
      </Text>
    );
  } else if (events.includes("The Nativity Fast")) {
    majorFastText = (
      <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>
        The Nativity Fast
      </Text>
    );
  } else {
    majorFastText = null;
  }

  if (events.includes("Strict Fast")) {
    minorFastText = (
      <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>
        Abstain from meat, fish, dairy, eggs, wine, olive oil
      </Text>
    );
  } else if (events.includes("Fast")) {
    minorFastText = (
      <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>
        Abstain from meat, dairy, eggs
      </Text>
    );
  } else if (events.includes("Meat Fast")) {
    minorFastText = (
      <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>
        Abstain from meat
      </Text>
    );
  } else {
    minorFastText = (
      <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>
        No Fast
      </Text>
    );
  }

  const SectionHeader = ({ section }: { section: any }) => {
    return section.title === "Top Image" ? (
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/images/orthodox/CrossInSquareThick.png")}
          style={[styles.topImage, { tintColor: theme.primary }]} // Using Theme.primary here
        />
      </View>
    ) : section.title === "Saint of the Day" ? (
      <View style={styles.saintOfTheDayContainer}>
        <Text
          style={[
            styles.saintOfTheDayTitle,
            { color: theme.moreImportantText },
          ]}
        >
          {todaysSaintsTitle}
        </Text>
        <Text
          style={[styles.saintOfTheDay, { color: theme.moreImportantText }]}
        >
          {todaysSaints.join("\n")}
        </Text>
        {majorFastText}
        {minorFastText}
      </View>
    ) : section.title === "Bottom Image" ? (
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/images/orthodox/TwoBarCross.png")}
          style={[styles.bottomImage, { tintColor: theme.primary }]} // Using Theme.primary here
        />
      </View>
    ) : section.sectionIndex === 0 ? (
      <>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginHorizontal: 10,
          }}
        >
          <View>
            <Text
              style={[
                styles.weekLabel,
                {
                  backgroundColor: theme.background,
                  color: theme.moreImportantText,
                },
              ]}
            >
              {section.weekLabel}
            </Text>

            <Text style={[styles.sectionHeader, { color: theme.sectionDate }]}>
              {section.title}
            </Text>
          </View>

          <Modal
            transparent
            visible={showMonthPicker}
            animationType="fade"
            onRequestClose={() => setShowMonthPicker(false)} // Android back button support
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.4)", // dim background
              }}
            >
              <MonthPicker
                onChange={onValueChange}
                value={selectedDate}
                minimumDate={new Date()}
                locale="en"
              />
            </View>
          </Modal>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowMonthPicker(true);
            }}
            style={{
              margin: 10,
              padding: 10,
              alignItems: "center",
            }}
          >
            <IconSymbol
              name="calendar"
              size={36}
              color={theme.lessImportantText}
            />
          </TouchableOpacity>
        </View>
      </>
    ) : (
      <>
        {section.weekLabel && (
          <Text
            style={[
              styles.weekLabel,
              {
                backgroundColor: theme.background,
                color: theme.moreImportantText,
              },
            ]}
          >
            {section.weekLabel}
          </Text>
        )}
        <Text style={[styles.sectionHeader, { color: theme.sectionDate }]}>
          {section.title}
        </Text>
      </>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {fastLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f4f5b" />
          </View>
        ) : (
          <View style={styles.verticalBarContainer}>
            <View
              style={[styles.verticalBar, { backgroundColor: theme.secondary }]}
            />

            <View style={styles.container}>
              {/* Hamburger menu button + Scroll to Top */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/settings");
                  }}
                  style={{ padding: 10 }}
                >
                  <MaterialIcons
                    name="menu"
                    style={styles.icon}
                    color={theme.lessImportantText}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    sectionListRef.current?.scrollToLocation({
                      sectionIndex: 0,
                      itemIndex: 0,
                      animated: true,
                    });
                  }}
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityLabel="Scroll to top"
                >
                  <MaterialIcons
                    name="arrow-upward"
                    style={styles.icon}
                    color={theme.lessImportantText}
                  />
                </TouchableOpacity>
              </View>

              <SectionList
                ref={sectionListRef}
                sections={sectionsWithUpcoming}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={SectionHeader}
                ListEmptyComponent={
                  <Text style={[styles.emptyMessage, { color: theme.detail }]}>
                    No events found.
                  </Text>
                }
                stickySectionHeadersEnabled={false} // Disable sticky headers
                contentContainerStyle={{ paddingBottom: 120 }} // Add padding to the bottom
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                  />
                }
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      justifyContent: "center",
      paddingVertical: 30,
    },
    verticalBarContainer: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    verticalBar: {
      width: 7,
      borderRadius: 10,
      marginLeft: 10,
    },
    emptyMessage: {
      textAlign: "center",
      fontSize: 18,
      marginTop: 20,
    },
    topImage: {
      width: 50,
      height: 50,
      resizeMode: "contain",
    },
    bottomImage: {
      width: 250,
      height: 300,
      resizeMode: "contain",
      paddingBottom: 100,
    },
    imageContainer: {
      alignItems: "center",
      marginTop: 30,
    },
    saintOfTheDayContainer: {
      padding: 15,
      alignItems: "center",
    },
    saintOfTheDayTitle: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
    },
    saintOfTheDay: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: "center",
    },
    MajorFastText: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
      textAlign: "center",
    },
    minorFastText: {
      fontSize: 18,
      textAlign: "center",
    },
    weekLabel: {
      marginLeft: 20,
      marginTop: 15,
      fontSize: 24,
      fontWeight: "bold",
    },
    sectionHeader: {
      marginLeft: 15,
      marginTop: 10,
      padding: 5,
      fontSize: 18,
    },
    icon: {
      fontSize: 36,
    },
  });
