import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/styles/Colours";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RNPickerSelect from "react-native-picker-select";
import {
  cancelAllFavouriteNotifications,
  cancelAllSaintNotifications,
  scheduleFavouriteNotifications,
  scheduleSaintNotificationsForNext7Days,
} from "@/utils/notifications";
import DateTimePicker from "react-native-modal-datetime-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CALENDAR_NOTIFICATION_SETTINGS,
  DAILY_SAINTS_NOTIFICATIONS_ENABLED,
  FAVOURITES_NOTIFICATIONS_ENABLED,
} from "@/constants/consts";
import eventBus from "@/utils/eventBus";
import { create } from "zustand";
import { useFontStyles } from "@/hooks/useFontStyles";
import SettingPicker from "@/components/SettingPicker";
import Slider from "@react-native-community/slider";

type FontSize = "small" | "medium" | "large";
type StartOfWeek = "sunday" | "monday";

interface SettingsState {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  loadFontSize: () => Promise<void>;

  startOfWeek: StartOfWeek;
  setStartOfWeek: (value: StartOfWeek) => void;
  loadStartOfWeek: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // Defaults
  fontSize: "medium",
  startOfWeek: "monday",

  // Font size
  setFontSize: (size) => {
    AsyncStorage.setItem("FONT_SIZE", size);
    set({ fontSize: size });
  },
  loadFontSize: async () => {
    const saved = await AsyncStorage.getItem("FONT_SIZE");
    if (saved === "small" || saved === "medium" || saved === "large") {
      set({ fontSize: saved });
    }
  },

  // Start of week
  setStartOfWeek: (value) => {
    AsyncStorage.setItem("START_OF_WEEK", value);
    set({ startOfWeek: value });
  },
  loadStartOfWeek: async () => {
    const saved = await AsyncStorage.getItem("START_OF_WEEK");
    if (saved === "sunday" || saved === "monday") {
      set({ startOfWeek: saved });
    }
  },
}));

export default function SettingsScreen() {
  const colorScheme = useColorScheme();

  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const pickerTheme = colorScheme === "dark" ? true : false;
  const router = useRouter();

  const [themeSelection, setThemeSelection] = useState("auto");
  const fontSize = useSettingsStore((state) => state.fontSize);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const startOfWeek = useSettingsStore((state) => state.startOfWeek);
  const setStartOfWeek = useSettingsStore((state) => state.setStartOfWeek);
  const [timezone, setTimezone] = useState("UTC");
  const [calendarNotifications, setCalendarNotifications] = useState<{
    [key: string]: boolean;
  }>({});
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const toggleCalendarNotification = (calendar: string) => {
    setCalendarNotifications((prev) => ({
      ...prev,
      [calendar]: !prev[calendar],
    }));
  };

  const [dailySaintsEnabled, setDailySaintsEnabled] = useState(true);
  const [favouriteNotificationsEnabled, setFavouriteNotificationsEnabled] =
    useState(true);

  // Calendar states
  const [calendarSettings, setCalendarSettings] = useState<{
    [key: string]: { enabled: boolean; daysBefore: number };
  }>({});

  useEffect(() => {
    const loadSettings = async () => {
      // Load theme
      const savedTheme = await AsyncStorage.getItem("APP_THEME");
      setThemeSelection(savedTheme || "auto");

      // Load daily saints notification setting
      const dailySaints = await AsyncStorage.getItem(
        DAILY_SAINTS_NOTIFICATIONS_ENABLED
      );
      if (dailySaints !== "true") {
        setDailySaintsEnabled(true);
        await AsyncStorage.setItem(DAILY_SAINTS_NOTIFICATIONS_ENABLED, "true");
      } else {
        setDailySaintsEnabled(dailySaints === "true");
      }

      // Load favourites notification setting
      const favs = await AsyncStorage.getItem(FAVOURITES_NOTIFICATIONS_ENABLED);
      if (favs === null) {
        setFavouriteNotificationsEnabled(true);
        await AsyncStorage.setItem(FAVOURITES_NOTIFICATIONS_ENABLED, "true");
      } else {
        setFavouriteNotificationsEnabled(favs === "true");
      }

      // Load font size and start of the week
      useSettingsStore.getState().loadFontSize();
      useSettingsStore.getState().loadStartOfWeek();

      // Calendar settings storage
      const calendarSettingsStore = await AsyncStorage.getItem(
        CALENDAR_NOTIFICATION_SETTINGS
      );
      if (calendarSettingsStore) {
        setCalendarSettings(JSON.parse(calendarSettingsStore));
      } else {
        const defaultSettings = {};
        [
          "youth",
          "church",
          "family",
          "ladies",
          "parish",
          "seniors",
          "weekly",
          "playgroup",
          "fellowship",
        ].forEach((name) => {
          defaultSettings[name] = { enabled: false, daysBefore: 1 };
        });
        await AsyncStorage.setItem(
          CALENDAR_NOTIFICATION_SETTINGS,
          JSON.stringify(defaultSettings)
        );
        setCalendarSettings(defaultSettings);
      }
    };

    loadSettings();
  }, []);

  const updateCalendarSetting = (
    calendar: string,
    updates: Partial<{ enabled: boolean; daysBefore: number }>
  ) => {
    const updated = {
      ...calendarSettings,
      [calendar]: {
        ...calendarSettings[calendar],
        ...updates,
      },
    };
    setCalendarSettings(updated);
    AsyncStorage.setItem(
      CALENDAR_NOTIFICATION_SETTINGS,
      JSON.stringify(updated)
    );
  };

  const font = useFontStyles();

  const dayOptions = [...Array(60).keys()].map((n) => ({
    label: `${n} day${n !== 1 ? "s" : ""}`,
    value: n,
  }));

  const eventColorMap = new Map<string, string>([
    ["youth", Colours.event.youth],
    ["weekly", Colours.event.weekly],
    ["church", Colours.event.church],
    ["family", Colours.event.family],
    ["ladies", Colours.event.ladies],
    ["parish", Colours.event.parish],
    ["seniors", Colours.event.seniors],
    ["playgroup", Colours.event.playgroup],
    ["fellowship", Colours.event.fellowship],
  ]);

  const getEventColor = (source: string) => eventColorMap.get(source) || "#000";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={28} color={theme.primary} />
          </TouchableOpacity>

          {/* Settings Header */}
          <Text style={[styles.title, font.heading, { color: theme.primary }]}>
            Settings
          </Text>

          {/* Theme Selection */}
          <SettingPicker
            label="Theme"
            value={themeSelection}
            onValueChange={(val) => {
              setThemeSelection(val);
              AsyncStorage.setItem("APP_THEME", val);
              eventBus.emit("themeChanged", val);
            }}
            items={[
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
              { label: "Auto", value: "auto" },
            ]}
            theme={theme}
            font={font}
            pickerTheme={pickerTheme}
            styles={styles}
          />

          {/* Start of Week */}
          <SettingPicker
            label="Start of the Week"
            value={startOfWeek}
            onValueChange={(val) => setStartOfWeek(val as "sunday" | "monday")}
            items={[
              { label: "Sunday", value: "sunday" },
              { label: "Monday", value: "monday" },
            ]}
            theme={theme}
            font={font}
            pickerTheme={pickerTheme}
            styles={styles}
          />

          {/* Font Size Selection */}
          <SettingPicker
            label="Font Size"
            value={fontSize}
            onValueChange={setFontSize}
            items={[
              { label: "Small", value: "small" },
              { label: "Medium", value: "medium" },
              { label: "Large", value: "large" },
            ]}
            theme={theme}
            font={font}
            pickerTheme={pickerTheme}
            styles={styles}
          />

          {/*
          <View style={styles.settingItem}>
            <Text style={[{ color: theme.moreImportantText }]}>Timezone</Text>
            <RNPickerSelect
              onValueChange={(value: string) => setTimezone(value)}
              value={timezone}
              items={[
                { label: 'UTC', value: 'UTC' },
                { label: 'GMT', value: 'GMT' },
                { label: 'EST', value: 'EST' },
                { label: 'PST', value: 'PST' },
                { label: 'CST', value: 'CST' },
              ]}
              style={{ inputIOSContainer: { pointerEvents: "none" } }}
              darkTheme={pickerTheme}

            />
          </View>
        */}

          <View style={styles.settingItem}>
            <Text
              style={[
                font.subheading,
                { color: theme.moreImportantText },
                { fontWeight: "bold", textDecorationLine: "underline" },
              ]}
            >
              Notification Settings
            </Text>
          </View>

          {/* Daily Saint Notification toggle */}
          <View style={styles.settingItem}>
            <Text style={[font.body, { color: theme.moreImportantText }]}>
              Saint of the Day
            </Text>
            <Switch
              value={dailySaintsEnabled}
              onValueChange={async (value) => {
                setDailySaintsEnabled(value);
                await AsyncStorage.setItem(
                  DAILY_SAINTS_NOTIFICATIONS_ENABLED,
                  value.toString()
                );
                if (value) {
                  scheduleSaintNotificationsForNext7Days();
                } else {
                  // Optional: cancel existing notifications here
                  console.log("cancel");
                  cancelAllSaintNotifications(); // You’ll define this next
                }
              }}
              trackColor={{ false: "#767577", true: "#34c658" }}
              thumbColor="#fff"
            />
          </View>

          {/* Favourites Notification toggle */}
          <View style={styles.settingItem}>
            <Text style={[font.body, { color: theme.moreImportantText }]}>
              Favourite Events
            </Text>
            <Switch
              value={favouriteNotificationsEnabled}
              onValueChange={(value) => {
                setFavouriteNotificationsEnabled(value);
                AsyncStorage.setItem(
                  FAVOURITES_NOTIFICATIONS_ENABLED,
                  value.toString()
                );
                if (value) {
                  scheduleFavouriteNotifications();
                } else {
                  // Optional: cancel existing notifications here
                  cancelAllFavouriteNotifications(); // You’ll define this next
                }
              }}
              trackColor={{ false: "#767577", true: "#34c658" }}
              thumbColor="#fff"
            />
          </View>

          {Object.keys(calendarSettings).map((calendar) => {
            const color = getEventColor(calendar);

            return (
              <View
                key={calendar}
                style={{
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 4, // Android shadow
                  marginVertical: 8,
                }}
              >
                <View
                  style={{
                    borderRadius: 12,
                    overflow: "hidden", // keeps rounded corners for content
                    backgroundColor: theme.itemBackground ?? "#fff",
                    flexDirection: "row",
                  }}
                >
                  {/* Left color bar */}
                  <View
                    style={{
                      width: 8,
                      backgroundColor: getEventColor(calendar),
                      borderTopLeftRadius: 12,
                      borderBottomLeftRadius: 12,
                    }}
                  />

                  {/* Content + Switch */}
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 4,
                    }}
                  >
                    {/* Content */}
                    <View style={{ flex: 1, padding: 14 }}>
                      <Text
                        style={[
                          font.body,
                          {
                            fontSize: 16,
                            fontWeight: "600",
                            color: theme.moreImportantText,
                            textTransform: "capitalize",
                          },
                        ]}
                      >
                        {calendar}
                      </Text>
                      <Text
                        style={[
                          font.body,
                          {
                            color: theme.lessImportantText ?? "#666",
                            marginTop: 4,
                          },
                        ]}
                      >
                        Notify {calendarSettings[calendar]?.daysBefore ?? 1} day
                        {calendarSettings[calendar]?.daysBefore !== 1
                          ? "s"
                          : ""}{" "}
                        before
                      </Text>
                      {calendarSettings[calendar]?.enabled && (
                        <View
                          style={{ marginTop: 10, alignSelf: "flex-start" }}
                        >
                          <RNPickerSelect
                            value={calendarSettings[calendar]?.daysBefore ?? 1}
                            onValueChange={(newVal) =>
                              updateCalendarSetting(calendar, {
                                daysBefore: newVal,
                              })
                            }
                            items={dayOptions}
                            placeholder={{}}
                            useNativeAndroidPickerStyle={false} // important for alignment!
                            darkTheme={pickerTheme}
                            style={{
                              inputIOSContainer: {
                                backgroundColor: theme.primary,
                                borderRadius: 8,
                                height: 40,
                                width: 110,
                                justifyContent: "center",
                                alignItems: "center",
                              },
                              inputIOS: {
                                color: theme.itemBackground,
                                textAlign: "center",
                                fontWeight: "500",
                                ...font.body,
                                pointerEvents: "none",
                              },
                              inputAndroidContainer: {
                                backgroundColor: theme.primary,
                                borderRadius: 8,
                                height: 40,
                                width: 110,
                                justifyContent: "center",
                                alignItems: "center",
                              },
                              inputAndroid: {
                                color: theme.itemBackground,
                                textAlign: "center",
                                fontWeight: "500",
                                ...font.body,
                                pointerEvents: "none",
                              },
                              iconContainer: {
                                right: 10,
                                top: Platform.OS === "android" ? 8 : 12,
                              },
                            }}
                          />
                        </View>
                      )}
                    </View>

                    {/* Right Side: Switch */}
                    <Switch
                      value={calendarSettings[calendar]?.enabled ?? false}
                      onValueChange={(value) =>
                        updateCalendarSetting(calendar, { enabled: value })
                      }
                      trackColor={{ false: "#767577", true: "#34c658" }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
};
