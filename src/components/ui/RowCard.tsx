import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { typography } from "@/theme/typography";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  // Drawn in a fixed-width column before the title, so titles line up across rows.
  icon?: ReactNode;
  // Drawn after the text: a chevron for a row that opens another screen.
  trailing?: ReactNode;
  // A row that leaves the app is a link to a screen reader.
  accessibilityRole?: "button" | "link";
  onPress: () => void;
};

// A row card like Home's event rows: an optional icon, a title with a line
// under it, and an optional trailing accessory. The whole row is one button
// that buzzes when pressed.
export default function RowCard({
  title,
  subtitle,
  icon,
  trailing,
  accessibilityRole = "button",
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
      accessibilityRole={accessibilityRole}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
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
      {trailing}
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
});
