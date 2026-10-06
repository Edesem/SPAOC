import React, { useRef } from "react";
import { Text, TouchableOpacity } from "react-native";
import RNPickerSelect from "react-native-picker-select";

type SettingPickerProps = {
  label: string;
  value: string;
  items: { label: string; value: string }[];
  onValueChange: (val: string) => void;
  theme: any;
  pickerTheme?: any;
  styles: any;
};

const SettingPicker: React.FC<SettingPickerProps> = ({
  label,
  value,
  items,
  onValueChange,
  theme,
  pickerTheme,
  styles,
}) => {
  const pickerRef = useRef<RNPickerSelect>(null);

  return (
    <TouchableOpacity
      style={styles.settingItem}
      activeOpacity={0.7}
      onPress={() => pickerRef.current?.togglePicker()}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{
        text: items.find((item) => item.value === value)?.label,
      }}
    >
      <Text style={{ color: theme.moreImportantText }}>{label}</Text>
      <RNPickerSelect
        ref={pickerRef}
        value={value}
        onValueChange={onValueChange}
        items={items}
        placeholder={{}}
        style={{
          inputIOSContainer: { pointerEvents: "none" },
          inputIOS: { color: theme.moreImportantText },
          inputAndroid: { color: theme.moreImportantText },
        }}
        darkTheme={pickerTheme}
      />
    </TouchableOpacity>
  );
};

export default SettingPicker;
