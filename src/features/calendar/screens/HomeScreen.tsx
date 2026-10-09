import OrnamentalDivider from "@/components/OrnamentalDivider";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme"; // or set up tsconfig to alias
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { now } from "@/lib/parishTime";
import { Colours } from "@/theme/colours";
import { typography } from "@/theme/typography";
import { TabParamList } from "@/types/routes";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import "expo-dev-client";
import * as Haptics from "expo-haptics";
import { router, useNavigation } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
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
import { EventItem } from "../components/EventItem";
import { HomeEventSection } from "../domain/homeRules";
import { useHomeFeature } from "../hooks/useHomeFeature";
import { EventData } from "../types";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

type Theme = typeof Colours.light;

// EventItem opens the event details itself, so the list passes no handler.
const renderItem = ({ item }: { item: EventData }) => (
  <EventItem item={item} onPress={() => null} />
);

const HomeListHeader = ({
  theme,
  loadErrorMessage,
  todaysSaintsTitle,
  todaysSaints,
  majorFastLabel,
  minorFastLabel,
}: {
  theme: Theme;
  loadErrorMessage: string | null;
  todaysSaintsTitle: string;
  todaysSaints: string[];
  majorFastLabel: string | null;
  minorFastLabel: string;
}) => (
  <>
    {loadErrorMessage ? (
      <Text
        accessibilityRole="alert"
        style={[styles.loadErrorMessage, { color: theme.detail }]}
      >
        {loadErrorMessage}
      </Text>
    ) : null}
    <View style={styles.imageContainer}>
      <Image
        testID="home-top-image"
        source={require("@assets/images/orthodox/CrossAndDots.png")}
        style={[styles.topImage, { tintColor: theme.primary }]}
      />
    </View>
    <View style={styles.saintOfTheDayContainer}>
      <Text style={[styles.saintOfTheDayTitle, { color: theme.commemorate }]}>
        {todaysSaintsTitle}
      </Text>
      <Text style={[styles.saintOfTheDay, { color: theme.moreImportantText }]}>
        {todaysSaints.join("\n")}
      </Text>
      {majorFastLabel ? (
        <Text
          style={[styles.MajorFastText, { color: theme.moreImportantText }]}
        >
          {majorFastLabel}
        </Text>
      ) : null}
      <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>
        {minorFastLabel}
      </Text>
    </View>
    <OrnamentalDivider colour={theme.secondary} style={styles.divider} />
  </>
);

const HomeListFooter = ({ theme }: { theme: Theme }) => (
  <View style={styles.imageContainer}>
    <Image
      testID="home-bottom-image"
      source={require("@assets/images/orthodox/TwoBarCross.png")}
      style={[styles.bottomImage, { tintColor: theme.primary }]}
    />
  </View>
);

const SectionHeader = ({
  section,
  theme,
}: {
  section: HomeEventSection;
  theme: Theme;
}) => (
  <>
    {/* The header's divider closes the first week, so only later ones get a rule. */}
    {section.weekLabel && section.sectionIndex > 0 ? (
      <OrnamentalDivider colour={theme.secondary} style={styles.divider} />
    ) : null}
    {section.weekLabel ? (
      <Text
        style={[
          styles.weekLabel,
          { backgroundColor: theme.background, color: theme.moreImportantText },
        ]}
      >
        {section.weekLabel}
      </Text>
    ) : null}
    <Text style={[styles.sectionHeader, { color: theme.sectionDate }]}>
      {section.title}
    </Text>
  </>
);

// Lives outside the SectionList so it stays reachable when a month has no events.
const MonthPickerModal = ({
  visible,
  selectedDate,
  onClose,
  onValueChange,
}: {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onValueChange: (event: string, newDate: Date) => void;
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onClose} // Android back button support
  >
    <View style={styles.monthPickerBackdrop}>
      <MonthPicker
        onChange={onValueChange}
        value={selectedDate}
        minimumDate={now()}
        locale="en"
      />
    </View>
  </Modal>
);

export default function HomeScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<TabParamList, "index">>();
  const sectionListRef = useRef<SectionList>(null);

  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const gutter = useReadableGutter();

  const {
    todaysSaints,
    todaysSaintsTitle,
    fastLoading,
    loadErrorMessage,
    majorFastLabel,
    minorFastLabel,
    sections,
    refreshing,
    onRefresh,
    selectedDate,
    isMonthFiltered,
    clearMonthFilter,
    showMonthPicker,
    setShowMonthPicker,
    onValueChange,
  } = useHomeFeature();

  // Scrolls past the header too, and works when there are no events.
  const scrollToTop = useCallback(() => {
    sectionListRef.current?.getScrollResponder()?.scrollTo({
      y: 0,
      animated: true,
    });
  }, []);

  // Scroll to top when pressing Home tab
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", scrollToTop);

    return unsubscribe;
  }, [navigation, scrollToTop]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.background, paddingHorizontal: gutter },
        ]}
      >
        {fastLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <View style={styles.container}>
            {/* Settings button on the left, month filter on the right */}
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
                accessibilityRole="button"
                accessibilityLabel="Settings"
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
                  setShowMonthPicker(true);
                }}
                style={{ padding: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Choose month"
              >
                <IconSymbol
                  name="calendar"
                  size={36}
                  color={theme.lessImportantText}
                />
              </TouchableOpacity>
            </View>

            <MonthPickerModal
              visible={showMonthPicker}
              selectedDate={selectedDate}
              onClose={() => setShowMonthPicker(false)}
              onValueChange={onValueChange}
            />

            {isMonthFiltered ? (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  clearMonthFilter();
                }}
                style={[
                  styles.clearFilterButton,
                  { backgroundColor: theme.primary },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Clear month filter"
              >
                <MaterialIcons name="close" size={20} color={theme.onPrimary} />
                <Text
                  style={[styles.clearFilterText, { color: theme.onPrimary }]}
                >
                  Clear month filter
                </Text>
              </TouchableOpacity>
            ) : null}

            <SectionList
              ref={sectionListRef}
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              renderSectionHeader={({ section }) => (
                <SectionHeader
                  section={section as HomeEventSection}
                  theme={theme}
                />
              )}
              ListHeaderComponent={
                <HomeListHeader
                  theme={theme}
                  loadErrorMessage={loadErrorMessage}
                  todaysSaintsTitle={todaysSaintsTitle}
                  todaysSaints={todaysSaints}
                  majorFastLabel={majorFastLabel}
                  minorFastLabel={minorFastLabel}
                />
              }
              ListFooterComponent={<HomeListFooter theme={theme} />}
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
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    paddingVertical: 30,
  },
  // Lines up with the event cards' 16pt inset.
  divider: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  emptyMessage: {
    ...typography.title,
    textAlign: "center",
    marginTop: 20,
  },
  loadErrorMessage: {
    ...typography.body,
    textAlign: "center",
    paddingHorizontal: 15,
    paddingTop: 10,
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
    ...typography.eyebrow,
    marginBottom: 6,
  },
  saintOfTheDay: {
    ...typography.displayTitle,
    marginBottom: 20,
    textAlign: "center",
  },
  MajorFastText: {
    ...typography.displayTitle,
    marginBottom: 10,
    textAlign: "center",
  },
  minorFastText: {
    ...typography.liturgicalTitle,
    textAlign: "center",
  },
  weekLabel: {
    ...typography.headline,
    marginLeft: 20,
    marginTop: 15,
  },
  sectionHeader: {
    ...typography.title,
    marginLeft: 15,
    marginTop: 10,
    padding: 5,
  },
  icon: {
    fontSize: 36,
  },
  monthPickerBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)", // dim background
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginVertical: 6,
  },
  clearFilterText: {
    ...typography.button,
  },
});
