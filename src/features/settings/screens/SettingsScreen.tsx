import SettingPicker from "../components/SettingPicker";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  getCalendarNotificationSettings,
  loadNotificationToggles,
  saveCalendarNotificationSettings,
  saveDailySaintNotificationsEnabled,
  saveFavouriteNotificationsEnabled,
  useSettingsStore,
  type CalendarNotificationSettings,
  type StartOfWeek,
  type ThemeChoice,
} from "@/services/settings";
import { getCalendarColour } from "@/domain/calendarSources";
import { Colours } from "@/theme/colours";
import { fontSize } from "@/theme/commonStyles";
import {
  cancelAllFavouriteNotifications,
  cancelAllSaintNotifications,
  scheduleFavouriteNotifications,
  scheduleSaintNotificationsForNext7Days,
} from "@/features/notifications";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const appVersion = Constants.expoConfig?.version ?? "Unknown";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();

  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const pickerTheme = colorScheme === "dark" ? true : false;
  const router = useRouter();

  const startOfWeek = useSettingsStore((state) => state.startOfWeek);
  const setStartOfWeek = useSettingsStore((state) => state.setStartOfWeek);
  const themeChoice = useSettingsStore((state) => state.themeChoice);
  const setThemeChoice = useSettingsStore((state) => state.setThemeChoice);

  const [dailySaintsEnabled, setDailySaintsEnabled] = useState(true);
  const [favouriteNotificationsEnabled, setFavouriteNotificationsEnabled] =
    useState(true);

  const [calendarSettings, setCalendarSettings] =
    useState<CalendarNotificationSettings>({});

  useEffect(() => {
    const loadNotifications = async () => {
      const { dailySaints, favourites } = await loadNotificationToggles();
      setDailySaintsEnabled(dailySaints);
      setFavouriteNotificationsEnabled(favourites);
    };
    loadNotifications();
  }, []);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        setCalendarSettings(await getCalendarNotificationSettings());
      } catch (e) {
        console.error(e);
      }
    };
    loadCalendar();
  }, []);

  const updateCalendarSetting = (
    calendar: string,
    updates: Partial<{ enabled: boolean; daysBefore: number }>,
  ) => {
    const updated = {
      ...calendarSettings,
      [calendar]: {
        ...calendarSettings[calendar],
        ...updates,
      },
    };
    setCalendarSettings(updated);
    saveCalendarNotificationSettings(updated);
    return updated[calendar];
  };

  const dayOptions = [...Array(60).keys()].map((n) => ({
    label: `${n} day${n !== 1 ? "s" : ""}`,
    value: n,
  }));

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
          <Text style={[styles.title, { color: theme.primary }]}>Settings</Text>

          {/* Theme Selection */}
          {false && (
            <SettingPicker
              label="Theme"
              value={themeChoice}
              onValueChange={(val) => setThemeChoice(val as ThemeChoice)}
              items={[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
                { label: "Auto", value: "auto" },
              ]}
              theme={theme}
              pickerTheme={pickerTheme}
              styles={styles}
            />
          )}

          {/* Start of Week */}
          <SettingPicker
            label="Start of the Week"
            value={startOfWeek}
            onValueChange={(val) => setStartOfWeek(val as StartOfWeek)}
            items={[
              { label: "Sunday", value: "sunday" },
              { label: "Monday", value: "monday" },
            ]}
            theme={theme}
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

          {false && (
            <View style={styles.settingItem}>
              <Text
                style={[
                  { color: theme.moreImportantText },
                  { fontSize: fontSize.subtitle, fontWeight: 600 },
                ]}
              >
                Notification Settings
              </Text>
            </View>
          )}

          {/* Daily Saint Notification toggle */}
          <View style={styles.settingItem}>
            <Text style={{ color: theme.moreImportantText }}>
              Notification for Saint of the day
            </Text>
            <Switch
              value={dailySaintsEnabled}
              onValueChange={async (value) => {
                setDailySaintsEnabled(value);
                await saveDailySaintNotificationsEnabled(value);
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

          {/* Favourites Notification toggle
          
          
          COMMENTED OUT*/}
          {false && (
            <View style={styles.settingItem}>
              <Text style={{ color: theme.moreImportantText }}>
                Favourite Events
              </Text>
              <Switch
                value={favouriteNotificationsEnabled}
                onValueChange={(value) => {
                  setFavouriteNotificationsEnabled(value);
                  saveFavouriteNotificationsEnabled(value);
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
          )}

          {/* Comment out code */}
          {false &&
            Object.keys(calendarSettings).map((calendar) => {
              const colour = getCalendarColour(calendar);

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
                        backgroundColor: colour,
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
                            {
                              color: theme.lessImportantText ?? "#666",
                              marginTop: 4,
                            },
                          ]}
                        >
                          Notify {calendarSettings[calendar]?.daysBefore ?? 1}{" "}
                          day
                          {calendarSettings[calendar]?.daysBefore !== 1
                            ? "s"
                            : ""}{" "}
                          before
                        </Text>

                        <View
                          style={{
                            marginTop: 10,
                            alignSelf: "flex-start",
                            opacity: calendarSettings[calendar]?.enabled
                              ? 1
                              : 0.5,
                          }}
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
                                pointerEvents: "none",
                              },
                              iconContainer: {
                                right: 10,
                                top: Platform.OS === "android" ? 8 : 12,
                              },
                            }}
                            disabled={!calendarSettings[calendar]?.enabled} // disable when not enabled
                          />
                        </View>
                      </View>

                      {/* Right Side: Switch */}
                      <View>
                        <Switch
                          value={calendarSettings[calendar]?.enabled ?? false}
                          onValueChange={(value) => {
                            updateCalendarSetting(calendar, {
                              enabled: value,
                            });
                          }}
                          trackColor={{ false: "#767577", true: "#34c658" }}
                          thumbColor="#fff"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

          {/* App Info */}
          <View style={styles.section}>
            <Text style={[styles.versionText, { color: theme.detail }]}>
              App Version: {appVersion}
            </Text>
          </View>
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
    fontSize: fontSize.title,
    fontWeight: 700,
    textAlign: "center",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  section: {
    gap: 16,
  },
  versionText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 500,
    marginBottom: 60,
  },
});
