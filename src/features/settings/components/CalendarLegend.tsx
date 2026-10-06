import { CALENDAR_SOURCES, getCalendarLabel } from "@/domain/calendarSources";
import { fontSize } from "@/theme/commonStyles";
import { StyleSheet, Text, View } from "react-native";

type CalendarLegendProps = {
  theme: any;
};

// What each event-row colour means. The swatch has the same shape as the bar
// on an event row, and the name is always beside it so colour isn't the only cue.
const CalendarLegend = ({ theme }: CalendarLegendProps) => (
  <View style={styles.container}>
    <Text
      accessibilityRole="header"
      style={[styles.heading, { color: theme.moreImportantText }]}
    >
      Calendars
    </Text>
    <Text style={[styles.hint, { color: theme.detail }]}>
      The colour beside each event shows which calendar it is from.
    </Text>
    {CALENDAR_SOURCES.map((calendar) => (
      <View key={calendar.name} style={styles.row}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.swatch, { backgroundColor: calendar.colour }]}
        />
        <Text style={[styles.name, { color: theme.moreImportantText }]}>
          {getCalendarLabel(calendar.name)}
        </Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  heading: {
    fontSize: fontSize.subtitle,
    fontWeight: "600",
  },
  hint: {
    fontSize: fontSize.body,
    lineHeight: 24,
    marginTop: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 40,
  },
  // Matches the event row's bar: an 8px tab with two rounded corners.
  swatch: {
    width: 8,
    height: 28,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopRightRadius: 1,
    borderBottomLeftRadius: 1,
  },
  name: {
    fontSize: fontSize.subtitle,
    flex: 1,
  },
});

export default CalendarLegend;
