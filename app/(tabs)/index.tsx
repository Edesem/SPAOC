import { renderItem } from "@/components/RenderItem";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme"; // or set up tsconfig to alias
import { useHomeFeature } from "@/hooks/useHomeFeature";
import { Colours } from "@/styles/Colours";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import "expo-dev-client";
import * as Haptics from "expo-haptics";
import { router, useNavigation } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
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

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function HomeScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList, "Home">>();
  const sectionListRef = useRef<SectionList>(null);

  const styles = getStyles();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;

  const {
    todaysSaints,
    todaysSaintsTitle,
    fastLoading,
    majorFastLabel,
    minorFastLabel,
    sections: sectionsWithUpcoming,
    refreshing,
    onRefresh,
    selectedDate,
    showMonthPicker,
    setShowMonthPicker,
    onValueChange,
  } = useHomeFeature();

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

  const majorFastText = majorFastLabel ? (
    <Text style={[styles.MajorFastText, { color: theme.moreImportantText }]}>
      {majorFastLabel}
    </Text>
  ) : null;

  const minorFastText = (
    <Text style={[styles.minorFastText, { color: theme.moreImportantText }]}>
      {minorFastLabel}
    </Text>
  );

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
