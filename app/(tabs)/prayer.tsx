import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  AKATHIST_URL,
  CENSING_HOME_URL,
  GREAT_COMPLINE_URL,
  GREAT_VESPERS_URL,
  MATINS_BILINGUAL_URL,
  MATINS_URL,
  MORNING_PRAYERS_URL,
  PARAKLESIS_URL,
  PREPARATION_FOR_COMMUNION_URL,
  PRESANCTIFIED_LITURGY_URL,
  SMALL_COMPLINE_PRIEST_URL,
  SMALL_COMPLINE_URL,
} from "@/constants/consts";
import { useColorScheme } from "@/hooks/useColorScheme";
import { usePrayerFeature } from "@/hooks/usePrayerFeature";
import { Colours } from "@/styles/Colours";
import { fontSize, getCommonStyles } from "@/styles/CommonStyles";
import { faBed } from "@fortawesome/free-solid-svg-icons/faBed";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons/faBookOpen";
import { faBurn } from "@fortawesome/free-solid-svg-icons/faBurn";
import { faChurch } from "@fortawesome/free-solid-svg-icons/faChurch";
import { faCloudMoon } from "@fortawesome/free-solid-svg-icons/faCloudMoon";
import { faCloudSun } from "@fortawesome/free-solid-svg-icons/faCloudSun";
import { faCoffee } from "@fortawesome/free-solid-svg-icons/faCoffee";
import { faHandsPraying } from "@fortawesome/free-solid-svg-icons/faHandsPraying";
import { faMoon } from "@fortawesome/free-solid-svg-icons/faMoon";
import { faPersonPraying } from "@fortawesome/free-solid-svg-icons/faPersonPraying";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faWineGlass } from "@fortawesome/free-solid-svg-icons/faWineGlass";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import he from "he";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import toTitleCase from "titlecase";

const prayers = [
  {
    title: "Morning Prayers",
    subtitle: "A short prayer to start the day",
    url: MORNING_PRAYERS_URL,
    icon: faCoffee,
  },
  {
    title: "Small Compline",
    subtitle: "A prayer before sleep & Communion",
    url: SMALL_COMPLINE_URL,
    icon: faBed,
  },
  {
    title: "Holy Communion",
    subtitle: "Preparation & Thanksgiving",
    url: PREPARATION_FOR_COMMUNION_URL,
    icon: faWineGlass,
  },
  {
    title: "Censing the Home",
    subtitle: "A prayer when you cense your home",
    url: CENSING_HOME_URL,
    icon: faBurn,
  },
];

const services = [
  {
    title: "Great Vespers",
    subtitle: "An evening sacrifice",
    url: GREAT_VESPERS_URL,
    icon: faCloudMoon,
  },
  {
    title: "Small Compline",
    subtitle: "When a Priest is serving",
    url: SMALL_COMPLINE_PRIEST_URL,
    icon: faChurch,
  },
  {
    title: "Paraklesis",
    subtitle: "To the Theotokos, the Mother of Light",
    url: PARAKLESIS_URL,
    icon: faPersonPraying,
  },
  {
    title: "Matins",
    subtitle: "Morning Offering",
    url: MATINS_URL,
    icon: faCloudSun,
  },
  {
    title: "Matins - Bilingual",
    subtitle: "English and Arabic Matins",
    url: MATINS_BILINGUAL_URL,
    icon: faBookOpen,
  },
];

const lentenServices = [
  {
    title: "Great Compline",
    subtitle: "A solemn Lenten evening prayer",
    url: GREAT_COMPLINE_URL,
    icon: faMoon,
  },
  {
    title: "Presanctified Liturgy",
    subtitle: "A Lenten Eucharistic service",
    url: PRESANCTIFIED_LITURGY_URL,
    icon: faHandsPraying,
  },
  {
    title: "Akathist",
    subtitle: "A standing hymn of praise, to the Theotokos",
    url: AKATHIST_URL,
    icon: faStar,
  },
];

export default function PrayerScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const CommonStyles = getCommonStyles(scheme);

  const { selectedDate, loading, refreshing, error, data, load, refresh } =
    usePrayerFeature();
  const day = data?.day;
  const liturgicalServices = data?.services;
  const epistle = day?.readings.find((r) => r.kind === "epistle");
  const gospel = day?.readings.find((r) => r.kind === "gospel");
  const thirdReading = day?.readings.find((r) => r.kind === "thirdReading");

  const chevronColor =
    colorScheme === "dark"
      ? Colours.dark.chevronColor
      : Colours.light.chevronColor;

  const router = useRouter();

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const styles = getStyles();

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date: Date) => {
    hideDatePicker();
    load(date);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[CommonStyles.container, { flex: 1 }]}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        >
          {/* Header */}

          <View style={styles.header}>
            <ThemedText type="title" style={CommonStyles.title}>
              Prayer
            </ThemedText>
          </View>

          <View
            style={[
              styles.headerRow,
              {
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.subtitle, { color: theme.detail }]}>
                &quot;Pray without ceasing.&quot;{"\n"}- 1 Thessalonians 5:17
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                showDatePicker();
              }}
              style={{
                padding: 5,
                shadowColor: "black",
              }}
            >
              <IconSymbol
                name="calendar"
                size={fontSize.icon}
                color={theme.lessImportantText}
              />
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              date={selectedDate}
            />
          </View>

          {/* Date Title */}
          <View style={{ alignItems: "center", marginVertical: 0 }}>
            <Text
              style={[styles.dateTitle, { color: theme.moreImportantText }]}
            >
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>

            {day?.feastTitle && (
              <Text
                style={[
                  styles.subtitle,
                  { marginTop: 5, color: theme.lessImportantText },
                ]}
              >
                {toTitleCase(day.feastTitle.toLowerCase())}
              </Text>
            )}
          </View>

          {/* Readings Section */}
          {loading ? (
            <View
              style={[
                styles.contentSection,
                {
                  flex: 1,
                  margin: 20,
                  backgroundColor: theme.itemBackground,
                  height: 250,
                },
              ]}
            >
              <Text style={CommonStyles.sectionTitle}>Loading Readings...</Text>
              <View style={styles.divider} />
              <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text
                  style={[
                    { color: theme.moreImportantText },
                    { paddingBottom: 20 },
                  ]}
                >
                  Loading readings...
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Epistle Navigation */}
              {epistle && (
                <TouchableOpacity
                  style={[
                    styles.contentSection,
                    {
                      flex: 1,
                      margin: 20,
                      backgroundColor: theme.itemBackground,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({
                      pathname: "/dailyReadings",
                      params: {
                        type: "epistle",
                        reading: epistle.fullText,
                        title: epistle.title, // Added title
                      },
                    });
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={CommonStyles.sectionTitle}>
                        {toTitleCase(epistle.title.toLowerCase())}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={fontSize.icon}
                      color={chevronColor}
                      style={styles.chevronIcon}
                    />
                  </View>
                  {!thirdReading ? (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: "#2E86AB" },
                        { height: 3 },
                      ]}
                    />
                  ) : (
                    <View style={styles.divider} />
                  )}
                  <Text
                    style={[
                      { color: theme.moreImportantText },
                      { paddingBottom: 20 },
                      { fontSize: fontSize.body },
                    ]}
                  >
                    {he.decode(epistle.teaser)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Gospel Navigation */}
              {gospel && (
                <TouchableOpacity
                  style={[
                    styles.contentSection,
                    {
                      flex: 1,
                      margin: 20,
                      backgroundColor: theme.itemBackground,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({
                      pathname: "/dailyReadings",
                      params: {
                        type: "gospel",
                        reading: gospel.fullText,
                        title: gospel.title, // Added title
                      },
                    });
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={CommonStyles.sectionTitle}>
                        {toTitleCase(gospel.title.toLowerCase())}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={fontSize.icon}
                      color={chevronColor}
                      style={styles.chevronIcon}
                    />
                  </View>
                  {!thirdReading ? (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: "#D4AF37" },
                        { height: 3 },
                      ]}
                    />
                  ) : (
                    <View style={styles.divider} />
                  )}
                  <Text
                    style={[
                      { color: theme.moreImportantText },
                      { paddingBottom: 20 },
                      { fontSize: fontSize.body },
                    ]}
                  >
                    {he.decode(gospel.teaser)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Third Reading Navigation */}
              {thirdReading && (
                <TouchableOpacity
                  style={[
                    styles.contentSection,
                    {
                      flex: 1,
                      margin: 20,
                      backgroundColor: theme.itemBackground,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({
                      pathname: "/dailyReadings",
                      params: {
                        type: "thirdReading",
                        reading: thirdReading.fullText, // Add full text for third reading
                        title: thirdReading.title, // Add title for third reading
                      },
                    });
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={CommonStyles.sectionTitle}>
                        {toTitleCase(thirdReading.title.toLowerCase())}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={fontSize.icon}
                      color={chevronColor}
                      style={styles.chevronIcon}
                    />
                  </View>
                  <View style={styles.divider} />
                  <Text
                    style={[
                      { color: theme.moreImportantText },
                      { paddingBottom: 20 },
                      { fontSize: fontSize.body },
                    ]}
                  >
                    {he.decode(thirdReading.teaser)}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Daily Liturgical Texts Section */}
          <View
            style={[
              styles.contentSection,
              { backgroundColor: theme.itemBackground },
            ]}
          >
            <Text style={CommonStyles.sectionTitle}>Daily Variables</Text>
            <View style={styles.divider} />

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text
                  style={[
                    { color: theme.moreImportantText },
                    { paddingBottom: 20 },
                    { fontSize: fontSize.body },
                  ]}
                >
                  Loading prayers...
                </Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>Error loading prayers</Text>
            ) : !liturgicalServices?.length ? (
              <Text style={styles.noTextsMessage}>
                There are no liturgical texts today.
              </Text>
            ) : (
              <View>
                {liturgicalServices.map((service) => (
                  <TouchableOpacity
                    key={service.title}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert(
                        "Silence Your Phone!",
                        "Before opening this prayer, please ensure your phone is on silent.",
                        [
                          {
                            text: "OK",
                            onPress: () => {
                              router.push({
                                pathname: "/pdfViewer",
                                params: {
                                  url: service.pdfUrl,
                                  title: service.title,
                                },
                              });
                            },
                          },
                        ],
                      );
                    }}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        { color: theme.moreImportantText },
                        { paddingBottom: 20 },
                        { fontSize: fontSize.body },
                      ]}
                    >
                      {service.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Additional Prayers Section */}
          <View
            style={[
              styles.contentSection,
              { backgroundColor: theme.itemBackground },
            ]}
          >
            <Text style={CommonStyles.sectionTitle}>Prayers</Text>
            <View style={styles.divider} />

            {prayers.map((prayer) => (
              <TouchableOpacity
                key={prayer.title}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({
                    pathname: "/pdfViewer",
                    params: {
                      url: prayer.url, // Add full text for third reading
                      title: prayer.title, // Add title for third reading
                    },
                  });
                }}
                activeOpacity={0.6}
              >
                <View style={[styles.rowContainer]}>
                  <FontAwesomeIcon
                    icon={prayer.icon}
                    size={35}
                    color={theme.moreImportantText}
                    style={styles.icon}
                  />
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.prayerTitle,
                        { color: theme.moreImportantText },
                      ]}
                    >
                      {prayer.title}
                    </Text>
                    <Text
                      style={[
                        styles.prayerSubtitle,
                        { color: theme.lessImportantText },
                      ]}
                    >
                      {prayer.subtitle}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Services Section */}
          <View
            style={[
              styles.contentSection,
              { backgroundColor: theme.itemBackground },
            ]}
          >
            <Text style={CommonStyles.sectionTitle}>Services</Text>
            <View style={styles.divider} />

            {services.map((service) => (
              <TouchableOpacity
                key={service.title}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(
                    "Silence Your Phone!",
                    "Before opening this prayer, please ensure your phone is on silent.",
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          router.push({
                            pathname: "/pdfViewer",
                            params: {
                              url: service.url, // Add full text for third reading
                              title: service.title, // Add title for third reading
                            },
                          });
                        },
                      },
                    ],
                  );
                }}
                activeOpacity={0.6}
              >
                <View style={[styles.rowContainer]}>
                  {/* Render the specific icon for each service */}
                  <FontAwesomeIcon
                    icon={service.icon}
                    size={35}
                    color={theme.moreImportantText}
                    style={styles.icon}
                  />
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.prayerTitle,
                        { color: theme.moreImportantText },
                      ]}
                    >
                      {service.title}
                    </Text>
                    <Text
                      style={[
                        styles.prayerSubtitle,
                        { color: theme.lessImportantText },
                      ]}
                    >
                      {service.subtitle}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lenten Services Section */}
          <View
            style={[
              styles.contentSection,
              { backgroundColor: theme.itemBackground },
            ]}
          >
            <Text style={CommonStyles.sectionTitle}>Lenten Services</Text>
            <View style={styles.divider} />

            {lentenServices.map((service) => (
              <TouchableOpacity
                key={service.title}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(
                    "Silence Your Phone!",
                    "Before opening this prayer, please ensure your phone is on silent.",
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          router.push({
                            pathname: "/pdfViewer",
                            params: {
                              url: service.url, // Add full text for third reading
                              title: service.title, // Add title for third reading
                            },
                          });
                        },
                      },
                    ],
                  );
                }}
                activeOpacity={0.6}
              >
                <View style={[styles.rowContainer]}>
                  {/* Render the specific icon for each service */}
                  <FontAwesomeIcon
                    icon={service.icon}
                    size={35}
                    color={theme.moreImportantText}
                    style={styles.icon}
                  />
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.prayerTitle,
                        { color: theme.moreImportantText },
                      ]}
                    >
                      {service.title}
                    </Text>
                    <Text
                      style={[
                        styles.prayerSubtitle,
                        { color: theme.lessImportantText },
                      ]}
                    >
                      {service.subtitle}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/orthodox/GolgothaCross.png")} // Adjust the path to your image
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getStyles = () =>
  StyleSheet.create({
    header: {
      alignItems: "center",
    },
    subtitle: {
      fontSize: 16,
      fontStyle: "italic",
      marginTop: 10,
      marginHorizontal: 26,
      textAlign: "center",
    },
    contentSection: {
      borderRadius: 10,
      padding: 20,
      margin: 20,
      shadowColor: "black",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    centered: {
      justifyContent: "center",
      alignItems: "center",
      flexGrow: 1,
      height: 150,
    },
    errorText: {
      color: "red",
      textAlign: "center",
    },
    serviceContainer: {
      marginBottom: 10,
    },
    linkText: {
      color: "blue",
      fontSize: 16,
      fontWeight: "bold",
      textDecorationLine: "underline",
    },
    prayerTitle: {
      fontSize: 18,
    },
    prayerSubtitle: {
      fontSize: 14,
      color: "#666",
      fontStyle: "italic",
      paddingBottom: 20,
    },
    divider: {
      height: 1,
      backgroundColor: "#E0E0E0",
      marginVertical: 10,
    },
    rowContainer: {
      borderRadius: 10,
      padding: 2,
      margin: 20,
      shadowColor: "black",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      flexDirection: "row", // Align items horizontally
    },
    textContainer: {
      flex: 1,
    },
    noTextsMessage: {
      textAlign: "center",
      fontSize: 16,
      color: "#666",
      fontStyle: "italic",
      marginVertical: 10,
    },
    bottomImage: {
      width: 150, // Adjust the width of the image
      height: 150, // Adjust the height of the image
      resizeMode: "contain", // Ensure the image doesn't get stretched
      marginBottom: 50,
    },
    imageContainer: {
      alignItems: "center",
      marginTop: 10, // Adjust the space above the image
      marginBottom: 10, // Adjust the space below the image if needed
      flex: 1, // Allows image container to take remaining space
      justifyContent: "center", // Aligns the image in the middle
    },
    chevronIcon: {
      marginTop: 8, // Space between text and chevron
    },
    dateTitle: {
      fontSize: 24,
      fontWeight: "bold",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 30,
      paddingLeft: 65,
    },
    icon: {
      fontSize: 36,
      marginRight: 10, // Adjust this value to your preference for spacing
    },
  });
