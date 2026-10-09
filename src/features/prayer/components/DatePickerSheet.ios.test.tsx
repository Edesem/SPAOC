import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import DatePickerSheet from "./DatePickerSheet.ios";

// The SwiftUI views only draw on a device. Each is replaced by a view that
// keeps its props, so a test can press the buttons and move the calendar.
const mockProps: Record<string, any> = {};
jest.mock("@expo/ui/swift-ui", () => {
  const React = require("react");
  const { View } = require("react-native");
  const stub = (name: string) => (props: any) => {
    mockProps[name] = props;
    return React.createElement(View, null, props.children);
  };
  const button = (props: any) => {
    mockProps[`Button:${props.label}`] = props;
    return null;
  };
  return {
    Host: stub("Host"),
    BottomSheet: (props: any) => {
      mockProps.BottomSheet = props;
      return props.isPresented
        ? React.createElement(View, null, props.children)
        : null;
    },
    Group: stub("Group"),
    VStack: stub("VStack"),
    HStack: stub("HStack"),
    Spacer: () => null,
    Button: button,
    DatePicker: (props: any) => {
      mockProps.DatePicker = props;
      return null;
    },
  };
});
jest.mock("@expo/ui/swift-ui/modifiers", () => ({
  datePickerStyle: (style: string) => ({ type: "datePickerStyle", style }),
  tint: (colour: string) => ({ type: "tint", colour }),
  padding: (value: unknown) => ({ type: "padding", value }),
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

describe("DatePickerSheet on iOS", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockProps)) delete mockProps[key];
  });

  it("presents the sheet only while visible", async () => {
    await renderSheet(false);
    expect(mockProps.BottomSheet.isPresented).toBe(false);

    await screen.rerender(
      <DatePickerSheet
        visible
        date={date}
        accentColour="#0a4068"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(mockProps.BottomSheet.isPresented).toBe(true);
  });

  it("shows the graphical calendar on the selected date, tinted with the accent", async () => {
    await renderSheet(true);

    expect(mockProps.DatePicker.selection).toBe(date);
    expect(mockProps.DatePicker.displayedComponents).toEqual(["date"]);
    expect(mockProps.DatePicker.modifiers).toEqual(
      expect.arrayContaining([
        { type: "datePickerStyle", style: "graphical" },
        { type: "tint", colour: "#0a4068" },
      ]),
    );
  });

  it("applies nothing while the date is only being browsed", async () => {
    const onConfirm = jest.fn();
    await renderSheet(true, { onConfirm });

    await act(() =>
      mockProps.DatePicker.onDateChange(new Date("2026-04-12T02:00:00.000Z")),
    );

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms the browsed date on Done", async () => {
    const onConfirm = jest.fn();
    await renderSheet(true, { onConfirm });
    const chosen = new Date("2026-04-12T02:00:00.000Z");

    await act(() => mockProps.DatePicker.onDateChange(chosen));
    await act(() => mockProps["Button:Done"].onPress());

    expect(onConfirm).toHaveBeenCalledWith(chosen);
  });

  it("confirms the original date on Done when the calendar was not moved", async () => {
    const onConfirm = jest.fn();
    await renderSheet(true, { onConfirm });

    await act(() => mockProps["Button:Done"].onPress());

    expect(onConfirm).toHaveBeenCalledWith(date);
  });

  it("cancels on Cancel without confirming", async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    await renderSheet(true, { onCancel, onConfirm });

    await act(() => mockProps["Button:Cancel"].onPress());

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancels when the sheet is swiped down", async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    await renderSheet(true, { onCancel, onConfirm });

    await act(() => mockProps.BottomSheet.onIsPresentedChange(false));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("forgets a browsed date that was cancelled the next time it opens", async () => {
    const onConfirm = jest.fn();
    const props = {
      date,
      accentColour: "#0a4068",
      onConfirm,
      onCancel: jest.fn(),
    };
    await render(<DatePickerSheet visible {...props} />);
    await act(() =>
      mockProps.DatePicker.onDateChange(new Date("2026-04-12T02:00:00.000Z")),
    );
    await screen.rerender(<DatePickerSheet visible={false} {...props} />);
    await screen.rerender(<DatePickerSheet visible {...props} />);

    await act(() => mockProps["Button:Done"].onPress());

    expect(onConfirm).toHaveBeenCalledWith(date);
  });
});
