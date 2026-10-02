import ReadingScreen from "@/app/dailyReadings";
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
});
