import SettingPicker from "../components/SettingPicker";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { useSettingsStore, type StartOfWeek } from "@/services/settings";
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

  const dailySaintsEnabled = useSettingsStore(
    (state) => state.dailySaintsEnabled,
  );
  const setDailySaintsEnabled = useSettingsStore(
    (state) => state.setDailySaintsEnabled,
  );

  const gutter = useReadableGutter();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          style={[styles.container, { paddingHorizontal: 20 + gutter }]}
        >
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

          {/* Daily Saint Notification toggle */}
          <View style={styles.settingItem}>
            <Text
              style={{
                color: theme.moreImportantText,
                fontSize: fontSize.subtitle,
                flex: 1,
                paddingRight: 12,
              }}
            >
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
  // The 28pt arrow sits in a 48pt box (44pt iOS / 48dp Android minimum).
  backButton: {
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    marginLeft: -10,
    marginBottom: 12,
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
    marginTop: 40,
    marginBottom: 40,
  },
});
