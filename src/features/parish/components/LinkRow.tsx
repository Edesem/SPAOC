import RowCard from "@/components/ui/RowCard";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import { MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet } from "react-native";
import FontAwesome5, {
  FontAwesome5IconProps,
} from "react-native-vector-icons/FontAwesome5";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  icon: string;
  iconSet?: "material" | "fontawesome";
  label: string;
  onPress: () => void;
  // A row that opens another screen in the app rather than a link outside it.
  chevron?: boolean;
};

// A `RowCard` for the Parish and Help screens: a brand-coloured icon, the label,
// and a chevron for a row inside the app or an external-link icon for one
// outside it.
export default function LinkRow({
  icon,
  iconSet = "material",
  label,
  onPress,
  chevron = false,
}: Props) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;

  return (
    <RowCard
      title={label}
      icon={
        iconSet === "fontawesome" ? (
          <FontAwesome5
            testID="link-row-icon"
            name={icon as FontAwesome5IconProps["name"]}
            size={24}
            color={theme.primary}
          />
        ) : (
          <MaterialIcons
            testID="link-row-icon"
            name={icon as ComponentProps<typeof MaterialIcons>["name"]}
            size={24}
            color={theme.primary}
          />
        )
      }
      trailing={
        chevron ? (
          <Ionicons
            testID="link-row-chevron"
            name="chevron-forward"
            size={28}
            color={theme.chevronColor}
            style={styles.trailing}
          />
        ) : (
          <Ionicons
            testID="link-row-external"
            name="open-outline"
            size={22}
            color={theme.chevronColor}
            style={styles.trailing}
          />
        )
      }
      accessibilityRole={chevron ? "button" : "link"}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  trailing: {
    marginLeft: 8,
  },
});
