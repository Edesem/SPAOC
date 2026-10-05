import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { lentenServices, prayers, services } from "../catalogue";
import { styles } from "../prayerStyles";
import { openPdf, openServicePdf } from "../openServicePdf";
import { usePrayerFeature } from "../hooks/usePrayerFeature";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { fontSize, getCommonStyles } from "@/theme/commonStyles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { DailyReadingsParams } from "@/types/routes";
import he from "he";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
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
                      } satisfies DailyReadingsParams,
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
                      } satisfies DailyReadingsParams,
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
                      } satisfies DailyReadingsParams,
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
                      openServicePdf(router, {
                        url: service.pdfUrl,
                        title: service.title,
                      });
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
                  openPdf(router, { url: prayer.url, title: prayer.title });
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
                  openServicePdf(router, {
                    url: service.url,
                    title: service.title,
                  });
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
                  openServicePdf(router, {
                    url: service.url,
                    title: service.title,
                  });
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
              source={require("@assets/images/orthodox/GolgothaCross.png")} // Adjust the path to your image
              style={[styles.bottomImage, { tintColor: theme.primary }]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
