import ReadingScreen from "./DailyReadingsScreen";
import { Colours } from "@/theme/colours";
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
    const { findByText } = await render(<ReadingScreen />);

    expect(await findByText("The Holy Gospel")).toBeTruthy();
    expect(await findByText("n the beginning was the Word")).toBeTruthy();
  });

  it("draws a thin bronze divider under the title", async () => {
    const { findByTestId } = await render(<ReadingScreen />);

    expect(await findByTestId("reading-divider")).toHaveStyle({
      backgroundColor: Colours.light.secondary,
      height: 1,
    });
  });

  it("opens the reading with a drop cap", async () => {
    const { findByTestId } = await render(<ReadingScreen />);

    expect(await findByTestId("drop-cap")).toHaveTextContent("I");
    expect(await findByTestId("drop-cap")).toHaveStyle({
      color: Colours.light.commemorate,
    });
  });

  it("sets the title and the reading in the serif, the liturgical voice", async () => {
    const { findByText } = await render(<ReadingScreen />);

    expect(await findByText("The Holy Gospel")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
    expect(await findByText("n the beginning was the Word")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontSize: 19,
      lineHeight: 26,
    });
  });

  it("renders the bottom toolbar after the scroll view so Android draws it on top", async () => {
    // On Android the toolbar is drawn in place, so a scroll view rendered after
    // it (with its opaque background) would cover the Copy button.
    const { toJSON } = await render(<ReadingScreen />);

    const { children } = toJSON() as {
      children: { props: { testID?: string } }[];
    };
    expect(children).toHaveLength(2);
    expect(children.at(-1)?.props.testID).toBe("toolbar-bottom");
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
