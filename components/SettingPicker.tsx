import React, { useRef } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import RNPickerSelect from "react-native-picker-select";

type SettingPickerProps = {
  label: string;
  value: string;
  items: { label: string; value: string }[];
  onValueChange: (val: string) => void;
  theme: any;
  font: any;
  pickerTheme?: any;
  styles: any;
};

const SettingPicker: React.FC<SettingPickerProps> = ({
  label,
  value,
  items,
  onValueChange,
  theme,
  font,
  pickerTheme,
  styles,
}) => {
  const pickerRef = useRef<RNPickerSelect>(null);

  return (
    <TouchableOpacity
      style={styles.settingItem}
      activeOpacity={0.7}
      onPress={() => pickerRef.current?.togglePicker()}
    >
      <Text style={[font.body, { color: theme.moreImportantText }]}>{label}</Text>
      <RNPickerSelect
        ref={pickerRef}
        value={value}
        onValueChange={onValueChange}
        items={items}
        placeholder={{}}
        style={{
          inputIOSContainer: { pointerEvents: "none" },
          inputIOS: { color: theme.moreImportantText, ...font.body },
          inputAndroid: { color: theme.moreImportantText, ...font.body },
        }}
        darkTheme={pickerTheme}
      />
    </TouchableOpacity>
  );
};

export default SettingPicker;
