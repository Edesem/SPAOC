export type DatePickerSheetProps = {
  visible: boolean;
  date: Date;
  accentColour: string;
  // Called with the chosen date once the user confirms; nothing is applied before.
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};
