import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import React from "react";
import type { DatePickerSheetProps } from "./datePickerSheetProps";

// The Material date dialog opens as soon as it mounts, so it is only mounted
// while visible. It has its own Cancel and OK.
const DatePickerSheet: React.FC<DatePickerSheetProps> = ({
  visible,
  date,
  accentColour,
  onConfirm,
  onCancel,
}) =>
  visible ? (
    <DateTimePicker
      mode="date"
      presentation="dialog"
      value={date}
      accentColor={accentColour}
      onValueChange={(_event, picked) => onConfirm(picked)}
      onDismiss={onCancel}
    />
  ) : null;

export default DatePickerSheet;
