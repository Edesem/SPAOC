import { SegmentedControl } from "@expo/ui/community/segmented-control";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { typography } from "@/theme/typography";

type SettingSegmentedProps = {
  label: string;
  value: string;
  items: { label: string; value: string }[];
  onValueChange: (val: string) => void;
  accentColour: string;
  textColour: string;
  appearance: "light" | "dark";
};

// A setting with a handful of options: the system segmented control sits in the
// row, so choosing is one tap and there is no modal to style.
const SettingSegmented: React.FC<SettingSegmentedProps> = ({
  label,
  value,
  items,
  onValueChange,
  accentColour,
  textColour,
  appearance,
}) => {
  const selectedIndex = items.findIndex((item) => item.value === value);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={label}
      accessibilityValue={{ text: items[selectedIndex]?.label }}
    >
      <Text style={[typography.title, styles.label, { color: textColour }]}>
        {label}
      </Text>
      <SegmentedControl
        style={styles.control}
        values={items.map((item) => item.label)}
        selectedIndex={selectedIndex}
        onValueChange={(selectedLabel) => {
          const picked = items.find((item) => item.label === selectedLabel);
          if (picked) {
            onValueChange(picked.value);
          }
        }}
        tintColor={accentColour}
        appearance={appearance}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Wraps under the label when large text leaves no room beside it.
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 8,
  },
  label: {
    flexGrow: 1,
    paddingRight: 12,
  },
  control: {
    minWidth: 180,
  },
});

export default SettingSegmented;
