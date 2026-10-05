import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { lentenServices, prayers, services } from "../catalogue";
import { styles } from "../prayerStyles";
import PdfListSection from "../components/PdfListSection";
import ReadingCard from "../components/ReadingCard";
import { openServicePdf } from "../openServicePdf";
import { usePrayerFeature } from "../hooks/usePrayerFeature";
import { useColorScheme } from "@/hooks/useColorScheme";
import { APP_TIME_ZONE } from "@/lib/parishTime";
import { Colours } from "@/theme/colours";
import { fontSize, getCommonStyles } from "@/theme/commonStyles";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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
                timeZone: APP_TIME_ZONE,
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
              {epistle && (
                <ReadingCard
                  reading={epistle}
                  accentColour={thirdReading ? undefined : "#2E86AB"}
                />
              )}
              {gospel && (
                <ReadingCard
                  reading={gospel}
                  accentColour={thirdReading ? undefined : "#D4AF37"}
                />
              )}
              {thirdReading && <ReadingCard reading={thirdReading} />}
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

          <PdfListSection heading="Prayers" entries={prayers} />
          <PdfListSection heading="Services" entries={services} silencePhone />
          <PdfListSection
            heading="Lenten Services"
            entries={lentenServices}
            silencePhone
          />

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
