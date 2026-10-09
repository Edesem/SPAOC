import { useToolbarIcon } from "@/components/ui/useToolbarIcon";
import { useColorScheme } from "@/hooks/useColorScheme"; // or set up tsconfig to alias
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { now } from "@/lib/parishTime";
import { Colours } from "@/theme/colours";
import { typography } from "@/theme/typography";
import { TabParamList } from "@/types/routes";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import "expo-dev-client";
import * as Haptics from "expo-haptics";
import { router, Stack, useNavigation } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MonthPicker from "react-native-month-year-picker";
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
  const navigation = useNavigation();
  const sectionListRef = useRef<SectionList>(null);
  // Where the list rests at the top. With the glass header the system insets
  // the list, so that is a negative offset rather than 0. Learnt from the
  // first scroll event.
  const restingTopRef = useRef(0);
  const learntRestingTopRef = useRef(false);

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
    monthFilterLabel,
    clearMonthFilter,
    showMonthPicker,
    setShowMonthPicker,
    onValueChange,
  } = useHomeFeature();

  const buttonColour = isMonthFiltered
    ? theme.primary
    : theme.lessImportantText;
  const menuIcon = useToolbarIcon(
    "line.3.horizontal",
    "menu",
    theme.lessImportantText,
  );
  const calendarIcon = useToolbarIcon(
    "calendar",
    "calendar-month",
    buttonColour,
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (learntRestingTopRef.current) return;
      learntRestingTopRef.current = true;
      restingTopRef.current = Math.min(0, event.nativeEvent.contentOffset.y);
    },
    [],
  );

  // Scrolls past the header too, and works when there are no events.
  const scrollToTop = useCallback(() => {
    sectionListRef.current?.getScrollResponder()?.scrollTo({
      y: restingTopRef.current,
      animated: true,
    });
  }, []);

  // Scroll to top when pressing Home tab. The screen sits in its own stack, so
  // the tab navigator is its parent.
  useEffect(() => {
    const tabs = navigation.getParent<BottomTabNavigationProp<TabParamList>>();

    return tabs?.addListener("tabPress", scrollToTop);
  }, [navigation, scrollToTop]);

  const openSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/settings");
  };

  const openMonthPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMonthPicker(true);
  };

  const showAllMonths = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearMonthFilter();
  };

  return (
    <>
      {/* The header shows the month only while a filter is on. */}
      <Stack.Screen options={{ title: monthFilterLabel ?? "" }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={menuIcon}
          tintColor={theme.lessImportantText}
          accessibilityLabel="Settings"
          onPress={openSettings}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        {isMonthFiltered ? (
          <Stack.Toolbar.Menu
            icon={calendarIcon}
            tintColor={buttonColour}
            accessibilityLabel={`Month filter, ${monthFilterLabel}`}
          >
            <Stack.Toolbar.MenuAction onPress={openMonthPicker}>
              Change Month
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction onPress={showAllMonths}>
              Show All Months
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        ) : (
          <Stack.Toolbar.Button
            icon={calendarIcon}
            tintColor={buttonColour}
            accessibilityLabel="Choose month"
            onPress={openMonthPicker}
          />
        )}
      </Stack.Toolbar>

      {/* The list is the screen's first view, so the system can fade it under
          the glass header and inset it below the bar. */}
      {fastLoading ? (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <SectionList
          ref={sectionListRef}
          testID="home-list"
          style={[styles.container, { backgroundColor: theme.background }]}
          contentInsetAdjustmentBehavior="automatic"
          onScroll={onScroll}
          scrollEventThrottle={16}
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
          // The accent bar is the content's left border, so it scrolls and
          // fades under the header with the events.
          contentContainerStyle={{
            paddingBottom: 120, // Add padding to the bottom
            marginLeft: gutter + 10,
            marginRight: gutter,
            borderLeftWidth: 7,
            borderLeftColor: theme.secondary,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
            />
          }
        />
      )}

      <MonthPickerModal
        visible={showMonthPicker}
        selectedDate={selectedDate}
        onClose={() => setShowMonthPicker(false)}
        onValueChange={onValueChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
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
  monthPickerBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)", // dim background
  },
});
