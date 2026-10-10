import OrnamentalDivider from "@/components/OrnamentalDivider";
import { useToolbarIcon } from "@/components/ui/useToolbarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { APP_TIME_ZONE } from "@/lib/parishTime";
import { Colours } from "@/theme/colours";
import { getCommonStyles } from "@/theme/commonStyles";
import { typography } from "@/theme/typography";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import toTitleCase from "titlecase";
import { lentenServices, prayers, services } from "../catalogue";
import { readingLabels } from "../domain/readingLabels";
import type { Reading } from "../services";
import DatePickerSheet from "../components/DatePickerSheet";
import PdfListSection from "../components/PdfListSection";
import PrayerRow from "../components/PrayerRow";
import ReadingCard from "../components/ReadingCard";
import { usePrayerFeature } from "../hooks/usePrayerFeature";
import { openServicePdf } from "../openServicePdf";
import { styles } from "../prayerStyles";

export default function PrayerScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const gutter = useReadableGutter();
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
  const cards = [epistle, gospel, thirdReading].filter(
    (reading): reading is Reading => reading !== undefined,
  );
  const labels = readingLabels(cards);

  const router = useRouter();

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const calendarIcon = useToolbarIcon(
    "calendar",
    "calendar-month",
    theme.lessImportantText,
  );

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date: Date) => {
    hideDatePicker();
    load(date);
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={calendarIcon}
          tintColor={theme.lessImportantText}
          accessibilityLabel="Choose date"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            showDatePicker();
          }}
        />
      </Stack.Toolbar>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={CommonStyles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: gutter,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {/* The title is the header's large title. */}
        <Text style={[styles.subtitle, { color: theme.detail }]}>
          &quot;Pray without ceasing.&quot; - 1 Thessalonians 5:17
        </Text>

        {/* Date Title */}
        <Text
          accessibilityRole="header"
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
          <Text style={[styles.feastTitle, { color: theme.commemorate }]}>
            {toTitleCase(day.feastTitle.toLowerCase())}
          </Text>
        )}

        <OrnamentalDivider
          colour={theme.secondary}
          style={styles.sectionBreak}
        />

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
            <Text style={[CommonStyles.sectionTitle, typography.readingTitle]}>
              Loading Readings...
            </Text>
            <View
              style={[styles.divider, { backgroundColor: theme.separator }]}
            />
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
            {cards.map((card, index) => (
              <ReadingCard
                key={card.kind}
                reading={card}
                label={labels[index]}
              />
            ))}
          </>
        )}

        {/* Daily Liturgical Texts Section */}
        <OrnamentalDivider
          colour={theme.secondary}
          style={styles.sectionBreak}
        />
        <View>
          <Text
            accessibilityRole="header"
            style={[styles.sectionHeading, { color: theme.moreImportantText }]}
          >
            Daily Variables
          </Text>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" />
              <Text
                style={[
                  { color: theme.moreImportantText },
                  { paddingBottom: 20 },
                  typography.body,
                ]}
              >
                Loading prayers...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorBlock}>
              <Text style={[styles.errorText, { color: theme.error }]}>
                Error loading prayers
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  load(selectedDate);
                }}
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Try loading prayers again"
              >
                <Text style={[styles.retryText, { color: theme.onPrimary }]}>
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          ) : !liturgicalServices?.length ? (
            <Text style={[styles.noTextsMessage, { color: theme.detail }]}>
              There are no liturgical texts today.
            </Text>
          ) : (
            liturgicalServices.map((service) => (
              <PrayerRow
                key={service.title}
                title={service.title}
                onPress={() =>
                  openServicePdf(router, {
                    url: service.pdfUrl,
                    title: service.title,
                  })
                }
              />
            ))
          )}
        </View>

        <OrnamentalDivider
          colour={theme.secondary}
          style={styles.sectionBreak}
        />
        <PdfListSection heading="Prayers" entries={prayers} />
        <OrnamentalDivider
          colour={theme.secondary}
          style={styles.sectionBreak}
        />
        <PdfListSection heading="Services" entries={services} silencePhone />
        <OrnamentalDivider
          colour={theme.secondary}
          style={styles.sectionBreak}
        />
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

      <DatePickerSheet
        visible={isDatePickerVisible}
        date={selectedDate}
        accentColour={theme.primary}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </>
  );
}
