import SettingPicker from "../components/SettingPicker";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  useSettingsStore,
  type StartOfWeek,
  type ThemeChoice,
} from "@/services/settings";
import { Colours } from "@/theme/colours";
import { fontSize } from "@/theme/commonStyles";
import { syncNotifications } from "@/features/notifications";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

  const dailySaintsEnabled = useSettingsStore(
    (state) => state.dailySaintsEnabled,
  );
  const setDailySaintsEnabled = useSettingsStore(
    (state) => state.setDailySaintsEnabled,
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
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
                await setDailySaintsEnabled(value);
                syncNotifications();
              }}
              accessibilityLabel="Notification for Saint of the day"
              trackColor={{ false: "#767577", true: "#34c658" }}
              thumbColor="#fff"
            />
          </View>

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
