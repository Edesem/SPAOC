import CalendarMarker from "@/components/CalendarMarker";
import { CALENDAR_SOURCES, getCalendarLabel } from "@/domain/calendarSources";
import { fontSize } from "@/theme/commonStyles";
import { typography } from "@/theme/typography";
import { StyleSheet, Text, View } from "react-native";

type CalendarLegendProps = {
  theme: any;
};

// What each event-row colour means. Each entry uses the same CalendarMarker as
// an event row, with the name always beside it so colour isn't the only cue.
const CalendarLegend = ({ theme }: CalendarLegendProps) => (
  <View style={styles.container}>
    <Text
      accessibilityRole="header"
      style={[styles.heading, { color: theme.moreImportantText }]}
    >
      Calendars
    </Text>
    <Text style={[styles.hint, { color: theme.detail }]}>
      The coloured diamond beside each event shows which calendar it is from.
    </Text>
    {CALENDAR_SOURCES.map((calendar) => (
      <View key={calendar.name} style={styles.row}>
        <CalendarMarker colour={calendar.colour} />
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
    ...typography.button,
    fontSize: fontSize.subtitle,
  },
  hint: {
    ...typography.body,
    marginTop: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 40,
  },
  name: {
    ...typography.title,
    flex: 1,
  },
});

export default CalendarLegend;
