import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import SettingSegmented from "./SettingSegmented";

// The native control is replaced by a view that records its props; the real
// one only draws on a device.
jest.mock("@expo/ui/community/segmented-control", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SegmentedControl: (props: object) =>
      React.createElement(View, { ...props, testID: "segmented-control" }),
  };
});

const items = [
  { label: "Sunday", value: "sunday" },
  { label: "Monday", value: "monday" },
];

const renderRow = (onValueChange = jest.fn()) =>
  render(
    <SettingSegmented
      label="Start of the Week"
      value="monday"
      items={items}
      onValueChange={onValueChange}
      accentColour="#0a4068"
      textColour="#333"
      appearance="light"
    />,
  );

describe("SettingSegmented", () => {
  it("selects the segment for the current value", async () => {
    const { getByTestId } = await renderRow();

    expect(getByTestId("segmented-control").props.selectedIndex).toBe(1);
    expect(getByTestId("segmented-control").props.values).toEqual([
      "Sunday",
      "Monday",
    ]);
  });

  it("reports the value of the tapped segment, not its label", async () => {
    const onValueChange = jest.fn();
    const { getByTestId } = await renderRow(onValueChange);

    await fireEvent(getByTestId("segmented-control"), "valueChange", "Sunday");

    expect(onValueChange).toHaveBeenCalledWith("sunday");
  });

  it("tints the control with the accent colour", async () => {
    const { getByTestId } = await renderRow();

    expect(getByTestId("segmented-control").props.tintColor).toBe("#0a4068");
  });

  it("names the row and its current value for screen readers", async () => {
    const { getByLabelText } = await renderRow();

    expect(getByLabelText("Start of the Week")).toHaveAccessibilityValue({
      text: "Monday",
    });
  });
});
