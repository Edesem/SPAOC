import {
  BottomSheet,
  Button,
  DatePicker,
  Group,
  Host,
  HStack,
  Spacer,
  VStack,
} from "@expo/ui/swift-ui";
import { datePickerStyle, padding, tint } from "@expo/ui/swift-ui/modifiers";
import React, { useState } from "react";
import type { DatePickerSheetProps } from "./datePickerSheetProps";

type SheetBodyProps = Pick<
  DatePickerSheetProps,
  "date" | "accentColour" | "onConfirm" | "onCancel"
>;

// Changing the month or year in the calendar's header changes its date, so the
// date is held as a draft and only applied on Done, which also matches the
// Android dialog's Cancel and OK. The sheet mounts its content only while
// presented, so each opening starts from the selected date again.
const SheetBody: React.FC<SheetBodyProps> = ({
  date,
  accentColour,
  onConfirm,
  onCancel,
}) => {
  const [draft, setDraft] = useState(date);

  return (
    <Group>
      <VStack modifiers={[padding({ all: 16 })]}>
        <HStack>
          <Button label="Cancel" onPress={onCancel} />
          <Spacer />
          <Button label="Done" onPress={() => onConfirm(draft)} />
        </HStack>
        <DatePicker
          selection={draft}
          displayedComponents={["date"]}
          onDateChange={setDraft}
          modifiers={[datePickerStyle("graphical"), tint(accentColour)]}
        />
      </VStack>
    </Group>
  );
};

// The system calendar in a system sheet.
const DatePickerSheet: React.FC<DatePickerSheetProps> = ({
  visible,
  ...body
}) => (
  // The sheet presents itself over the screen, so the host takes no room.
  <Host style={{ position: "absolute", width: 0, height: 0 }}>
    <BottomSheet
      isPresented={visible}
      onIsPresentedChange={(presented) => {
        if (!presented) {
          body.onCancel();
        }
      }}
      fitToContents
    >
      <SheetBody {...body} />
    </BottomSheet>
  </Host>
);

export default DatePickerSheet;
