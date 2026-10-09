import ReadingScreen from "./DailyReadingsScreen";
import { fontFamily } from "@/theme/typography";
import { DailyReadingsParams } from "@/types/routes";
import { fireEvent, render } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React from "react";

const params: DailyReadingsParams = {
  type: "gospel",
  reading: "In the beginning was the Word",
  title: "THE HOLY GOSPEL",
};
jest.mock("expo-router", () => ({
  ...require("@/testing/expoRouterStack").createStackMock(),
  useLocalSearchParams: () => params,
  useNavigation: () => ({ setOptions: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

describe("ReadingScreen", () => {
  it("shows the title and reading from its route params", async () => {
    const { findByText, findByDisplayValue } = await render(<ReadingScreen />);

    expect(await findByText("The Holy Gospel")).toBeTruthy();
    expect(await findByDisplayValue(params.reading)).toBeTruthy();
  });

  it("sets the title and the reading in the serif, the liturgical voice", async () => {
    const { findByText, findByDisplayValue } = await render(<ReadingScreen />);

    expect(await findByText("The Holy Gospel")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
    expect(await findByDisplayValue(params.reading)).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontSize: 19,
      lineHeight: 26,
    });
  });

  it("copies the reading and its title from the native Copy button", async () => {
    const { findByLabelText } = await render(<ReadingScreen />);

    await fireEvent.press(await findByLabelText("Copy"));

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
      "In the beginning was the Word\n\n- The Holy Gospel",
    );
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it("relabels the button as Copied once the reading is copied", async () => {
    const { findByLabelText } = await render(<ReadingScreen />);

    await fireEvent.press(await findByLabelText("Copy"));

    expect(await findByLabelText("Copied")).toBeTruthy();
  });
});
