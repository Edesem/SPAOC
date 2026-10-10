import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
import { render } from "@testing-library/react-native";
import React from "react";
import { Platform } from "react-native";
import { TabStack } from "./TabStack";

const mockStackProps = jest.fn();
jest.mock("expo-router", () => ({
  Stack: (props: object) => {
    mockStackProps(props);
    return null;
  },
}));

const setIos = (version: string) => {
  jest.replaceProperty(Platform, "OS", "ios");
  jest.spyOn(Platform, "Version", "get").mockReturnValue(version as never);
};

const lastScreenOptions = () =>
  mockStackProps.mock.calls.at(-1)![0].screenOptions;

afterEach(() => {
  jest.restoreAllMocks();
  mockStackProps.mockClear();
});

describe("TabStack", () => {
  it("gives the stack the title it was given, even an empty one", async () => {
    await render(<TabStack title="" />);

    expect(lastScreenOptions().title).toBe("");
  });

  it("uses the transparent glass header on iOS 26", async () => {
    setIos("26.0");

    await render(<TabStack title="Events" />);

    expect(lastScreenOptions()).toMatchObject({
      title: "Events",
      headerTransparent: true,
      headerTintColor: Colours.light.moreImportantText,
    });
    expect(lastScreenOptions().headerLargeTitleEnabled).toBeUndefined();
  });

  it("adds a serif large title when asked for one", async () => {
    setIos("26.0");

    await render(<TabStack title="Favourites" largeTitle />);

    expect(lastScreenOptions()).toMatchObject({
      headerLargeTitleEnabled: true,
      headerLargeTitleStyle: { fontFamily: fontFamily.serif },
    });
  });

  it("keeps the solid themed header on iOS 18", async () => {
    setIos("18.4");

    await render(<TabStack title="Favourites" largeTitle />);

    expect(lastScreenOptions().headerTransparent).toBeUndefined();
    expect(lastScreenOptions().headerStyle).toEqual({
      backgroundColor: Colours.light.background,
    });
  });
});
