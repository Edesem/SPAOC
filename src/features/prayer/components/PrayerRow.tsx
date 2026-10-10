import RowCard from "@/components/ui/RowCard";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colours } from "@/theme/colours";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconDefinition;
  onPress: () => void;
};

// A `RowCard` with an optional icon in the brand colour (navy in light mode,
// bronze in dark) and a chevron.
export default function PrayerRow({
  title,
  subtitle,
  icon,
  onPress,
}: Props): JSX.Element {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colours.dark : Colours.light;

  return (
    <RowCard
      title={title}
      subtitle={subtitle}
      icon={
        icon ? (
          <FontAwesomeIcon icon={icon} size={24} color={theme.primary} />
        ) : undefined
      }
      trailing={
        <Ionicons
          testID="prayer-row-chevron"
          name="chevron-forward"
          size={28}
          color={theme.chevronColor}
          style={styles.chevron}
        />
      }
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  chevron: {
    marginLeft: 8,
  },
});
