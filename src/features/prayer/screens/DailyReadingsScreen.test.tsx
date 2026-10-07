import ReadingScreen from "./DailyReadingsScreen";
import { fontFamily } from "@/theme/typography";
import { DailyReadingsParams } from "@/types/routes";
import { render } from "@testing-library/react-native";
import React from "react";

const params: DailyReadingsParams = {
  type: "gospel",
  reading: "In the beginning was the Word",
  title: "THE HOLY GOSPEL",
};
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => params,
  useNavigation: () => ({ setOptions: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default,
);
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
      fontSize: 18,
      lineHeight: 26,
    });
  });

  it("sets the copy button in the sans at 700", async () => {
    const { findByText } = await render(<ReadingScreen />);

    expect(await findByText("Copy")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontWeight: "700",
    });
  });
});
