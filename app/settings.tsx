import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
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
  DAILY_SAINTS_NOTIFICATIONS_ENABLED,
  FAVOURITES_NOTIFICATIONS_ENABLED,
} from "@/constants/consts";
import eventBus from "@/utils/eventBus";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();

  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const pickerTheme = colorScheme === "dark" ? true : false;
  const router = useRouter();

  const [themeSelection, setThemeSelection] = useState("auto");
  const [fontSize, setFontSize] = useState("medium");
  const [startOfWeek, setStartOfWeek] = useState("sunday");
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

  useEffect(() => {
    const loadSettings = async () => {
      // Load theme
      const savedTheme = await AsyncStorage.getItem("APP_THEME");
      setThemeSelection(savedTheme || "auto");

      // Load daily saints notification setting
      const dailySaints = await AsyncStorage.getItem(
        DAILY_SAINTS_NOTIFICATIONS_ENABLED
      );
      if (dailySaints === null) {
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
    };

    loadSettings();
  }, []);

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
          <View style={styles.settingItem}>
            <Text
              style={[styles.settingText, { color: theme.moreImportantText }]}
            >
              Theme
            </Text>
            <RNPickerSelect
              onValueChange={(value: string) => {
                setThemeSelection(value);
                console.log("Selected theme:", value);
                AsyncStorage.setItem("APP_THEME", value);
                eventBus.emit("themeChanged", value);
              }}
              value={themeSelection}
              items={[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
                { label: "Auto", value: "auto" },
              ]}
              placeholder={{}}
              style={{
                inputIOSContainer: { pointerEvents: "none" },
                inputIOS: { color: theme.moreImportantText },
                inputAndroid: { color: theme.moreImportantText },
              }}
              darkTheme={pickerTheme}
            />
          </View>

          {/* Start of Week */}
          <View style={styles.settingItem}>
            <Text
              style={[styles.settingText, { color: theme.moreImportantText }]}
            >
              Start of the Week
            </Text>
            <RNPickerSelect
              onValueChange={(value: string) => setStartOfWeek(value)}
              value={startOfWeek}
              items={[
                { label: "Sunday", value: "sunday" },
                { label: "Monday", value: "monday" },
              ]}
              placeholder={{}}
              style={{
                inputIOSContainer: { pointerEvents: "none" },
                inputIOS: { color: theme.moreImportantText },
                inputAndroid: { color: theme.moreImportantText },
              }}
              darkTheme={pickerTheme}
            />
          </View>

          {/* Font Size Selection */}
          <View style={styles.settingItem}>
            <Text
              style={[styles.settingText, { color: theme.moreImportantText }]}
            >
              Font Size
            </Text>
            <RNPickerSelect
              onValueChange={(value: string) => setFontSize(value)}
              value={fontSize}
              items={[
                { label: "Small", value: "small" },
                { label: "Medium", value: "medium" },
                { label: "Large", value: "large" },
              ]}
              placeholder={{}}
              style={{
                inputIOSContainer: { pointerEvents: "none" },
                inputIOS: { color: theme.moreImportantText },
                inputAndroid: { color: theme.moreImportantText },
              }}
              darkTheme={pickerTheme}
            />
          </View>

          {/*
          <View style={styles.settingItem}>
            <Text style={[styles.settingText, { color: theme.moreImportantText }]}>Timezone</Text>
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

          {/* Daily Saint Notification toggle */}
          <View style={styles.settingItem}>
            <Text
              style={[styles.settingText, { color: theme.moreImportantText }]}
            >
              Saint of the Day Notification
            </Text>
            <Switch
              value={dailySaintsEnabled}
              onValueChange={(value) => {
                setDailySaintsEnabled(value);
                AsyncStorage.setItem(
                  DAILY_SAINTS_NOTIFICATIONS_ENABLED,
                  value.toString()
                );
                if (value) {
                  scheduleSaintNotificationsForNext7Days();
                } else {
                  // Optional: cancel existing notifications here
                  cancelAllSaintNotifications(); // You’ll define this next
                }
              }}
              trackColor={{ false: "#767577", true: "#34c658" }}
              thumbColor="#fff"
            />
          </View>

          {/* Favourites Notification toggle */}
          <View style={styles.settingItem}>
            <Text
              style={[styles.settingText, { color: theme.moreImportantText }]}
            >
              Favourite Events Notification
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

          {/* Calendar Notification Toggles */}
          {[
            "Youth Calendar",
            "Church Calendar",
            "Family Calendar",
            "Ladies Calendar",
            "Parish Calendar",
            "Seniors Calendar",
            "Weekly Calendar",
            "Playgroup Calendar",
            "Fellowship Calendar",
          ].map((calendar) => (
            <View style={styles.settingItem} key={calendar}>
              <Text
                style={[styles.settingText, { color: theme.moreImportantText }]}
              >
                {calendar}
              </Text>
              <Switch
                value={calendarNotifications[calendar] || false}
                onValueChange={() => toggleCalendarNotification(calendar)}
                trackColor={{ false: "#767577", true: "#34c658" }}
                thumbColor="#fff"
              />
            </View>
          ))}

          {/* Notification Time Picker */}
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={styles.settingItem}
          >
            <Text
              style={[styles.settingText, { color: theme.moreImportantText }]}
            >
              Notify Before Event
            </Text>
            <Text style={[styles.settingText, { color: theme.primary }]}>
              {notificationTime.getHours()}:
              {notificationTime.getMinutes().toString().padStart(2, "0")}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={notificationTime}
              mode="time"
              display="default"
              onChange={(event: any, selectedTime?: Date) => {
                setShowTimePicker(false);
                if (selectedTime) setNotificationTime(selectedTime);
              }}
            />
          )}
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingText: {
    fontSize: 18,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
};
