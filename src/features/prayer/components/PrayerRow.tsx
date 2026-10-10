import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { typography } from "@/theme/typography";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconDefinition;
  onPress: () => void;
};

// A row card like Home's event rows: an optional bronze icon, a title with a
// line under it, and a chevron. The whole row is one button.
export default function PrayerRow({
  title,
  subtitle,
  icon,
  onPress,
}: Props): JSX.Element {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={0.6}
      style={[styles.row, { backgroundColor: theme.itemBackground }]}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
    >
      {icon ? (
        <View style={styles.icon}>
          <FontAwesomeIcon icon={icon} size={24} color={theme.secondary} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.moreImportantText }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.lessImportantText }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons
        testID="prayer-row-chevron"
        name="chevron-forward"
        size={28}
        color={theme.chevronColor}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

// The card is the event row's: 16pt in from the edge, 8pt corners, a soft shadow.
const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginVertical: 2,
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  icon: {
    width: 32,
    marginRight: 12,
    alignItems: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.label,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
});
