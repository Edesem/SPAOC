import React from "react";
import { render } from "@testing-library/react-native";
import DatePickerSheet from "./DatePickerSheet.android";

// Keeps the props so a test can answer the dialog the way the system would.
let mockPickerProps: any;
let mockPickerRenders = 0;
jest.mock("@expo/ui/community/datetime-picker", () => ({
  DateTimePicker: (props: any) => {
    mockPickerProps = props;
    mockPickerRenders += 1;
    return null;
  },
}));

const date = new Date("2026-03-15T02:00:00.000Z");

const renderSheet = (visible: boolean, handlers = {}) =>
  render(
    <DatePickerSheet
      visible={visible}
      date={date}
      accentColour="#0a4068"
      onConfirm={jest.fn()}
      onCancel={jest.fn()}
      {...handlers}
    />,
  );

describe("DatePickerSheet on Android", () => {
  beforeEach(() => {
    mockPickerProps = undefined;
    mockPickerRenders = 0;
  });

  it("shows nothing while closed, because the dialog opens as soon as it mounts", async () => {
    await renderSheet(false);

    expect(mockPickerRenders).toBe(0);
  });

  it("opens the system date dialog on the selected date", async () => {
    await renderSheet(true);

    expect(mockPickerProps.presentation).toBe("dialog");
    expect(mockPickerProps.mode).toBe("date");
    expect(mockPickerProps.value).toBe(date);
  });

  it("tints the dialog with the accent colour", async () => {
    await renderSheet(true);

    expect(mockPickerProps.accentColor).toBe("#0a4068");
  });

  it("confirms the date that was chosen", async () => {
    const onConfirm = jest.fn();
    await renderSheet(true, { onConfirm });
    const chosen = new Date("2026-04-12T02:00:00.000Z");

    mockPickerProps.onValueChange({ nativeEvent: {} }, chosen);

    expect(onConfirm).toHaveBeenCalledWith(chosen);
  });

  it("cancels when the dialog is dismissed", async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    await renderSheet(true, { onCancel, onConfirm });

    mockPickerProps.onDismiss();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
