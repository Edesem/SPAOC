import CalendarLegend from "../components/CalendarLegend";
import SettingPicker from "../components/SettingPicker";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useReadableGutter } from "@/hooks/useReadableGutter";
import { useSettingsStore, type StartOfWeek } from "@/services/settings";
import { Colours } from "@/theme/colours";
import { typography } from "@/theme/typography";
import { syncNotifications } from "@/features/notifications";
import Constants from "expo-constants";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

const appVersion = Constants.expoConfig?.version ?? "Unknown";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();

  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;
  const pickerTheme = colorScheme === "dark" ? true : false;

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
    // The scroll view is the screen's first view so the system can fade it
    // under the glass header; the title and back button are the native header's.
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={{ paddingHorizontal: gutter }}>
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
            style={[
              typography.title,
              {
                color: theme.moreImportantText,
                flex: 1,
                paddingRight: 12,
              },
            ]}
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

        <CalendarLegend theme={theme} />

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.versionText, { color: theme.detail }]}>
            App Version: {appVersion}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
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
    ...typography.aside,
    fontSize: typography.label.fontSize,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 40,
  },
});
