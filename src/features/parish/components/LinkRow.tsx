import { typography } from "@/theme/typography";
import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import FontAwesome5, {
  FontAwesome5IconProps,
} from "react-native-vector-icons/FontAwesome5";

type Props = {
  icon: string;
  iconSet?: "material" | "fontawesome";
  label: string;
  onPress: () => void;
  color: string;
  // A row that opens another screen in the app rather than a link outside it.
  chevron?: boolean;
};

export default function LinkRow({
  icon,
  iconSet = "material",
  label,
  onPress,
  color,
  chevron = false,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole={chevron ? "button" : "link"}
    >
      {iconSet === "fontawesome" ? (
        <FontAwesome5
          name={icon as FontAwesome5IconProps["name"]}
          size={24}
          color={color}
        />
      ) : (
        <MaterialIcons
          name={icon as ComponentProps<typeof MaterialIcons>["name"]}
          size={24}
          color={color}
        />
      )}
      <Text style={[styles.label, { color }]}>{label}</Text>
      {chevron && <MaterialIcons name="chevron-right" size={24} color={color} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  label: {
    ...typography.bodyStrong,
    flex: 1,
  },
});
