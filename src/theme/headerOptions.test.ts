import { Platform } from "react-native";
import { Colours } from "./colours";
import {
  glassHeaderOptions,
  largeTitleHeaderOptions,
  solidHeaderOptions,
  supportsLiquidGlass,
} from "./headerOptions";
import { fontFamily } from "./typography";

const setPlatform = (os: "ios" | "android", version: string | number) => {
  jest.replaceProperty(Platform, "OS", os);
  jest.spyOn(Platform, "Version", "get").mockReturnValue(version as never);
};

afterEach(() => jest.restoreAllMocks());

describe("supportsLiquidGlass", () => {
  it.each([
    ["ios", "26.0", true],
    ["ios", "27.0", true],
    ["ios", "18.4", false],
    ["android", 36, false],
  ] as const)("is %s %s -> %s", (os, version, expected) => {
    setPlatform(os, version);
    expect(supportsLiquidGlass()).toBe(expected);
  });
});

describe("solidHeaderOptions", () => {
  it("paints the header in the themed background with serif titles", () => {
    expect(solidHeaderOptions("dark")).toEqual({
      headerTitleAlign: "center",
      headerBackTitle: "Back",
      headerStyle: { backgroundColor: Colours.dark.background },
      headerTintColor: Colours.dark.moreImportantText,
      headerTitleStyle: { fontFamily: fontFamily.serif, fontWeight: "700" },
    });
  });
});

describe("glassHeaderOptions", () => {
  it("is transparent with no background or blur on iOS 26", () => {
    setPlatform("ios", "26.0");
    const options = glassHeaderOptions("light");

    expect(options.headerTransparent).toBe(true);
    expect(options.headerStyle).toBeUndefined();
    expect(options.headerBlurEffect).toBeUndefined();
    expect(options.headerTintColor).toBe(Colours.light.moreImportantText);
  });

  it("asks for a soft top edge rather than a hard cut-off line", () => {
    setPlatform("ios", "27.0");

    expect(glassHeaderOptions("light").scrollEdgeEffects).toEqual({
      top: "soft",
    });
  });

  it("drops the root stack's solid background when merged over it", () => {
    setPlatform("ios", "26.0");

    // How the navigator combines a stack's screenOptions with a screen's own.
    const merged = {
      ...solidHeaderOptions("light"),
      ...glassHeaderOptions("light"),
    };

    expect(merged.headerStyle).toBeUndefined();
    expect(merged.headerTransparent).toBe(true);
  });

  it("keeps the solid header on iOS 18", () => {
    setPlatform("ios", "18.4");
    expect(glassHeaderOptions("light")).toEqual(solidHeaderOptions("light"));
  });

  it("keeps the solid header on Android", () => {
    setPlatform("android", 36);
    expect(glassHeaderOptions("dark")).toEqual(solidHeaderOptions("dark"));
  });
});

describe("largeTitleHeaderOptions", () => {
  it("adds a serif large title to the glass header on iOS 26", () => {
    setPlatform("ios", "26.0");
    const options = largeTitleHeaderOptions("light");

    expect(options.headerTransparent).toBe(true);
    expect(options.headerLargeTitleEnabled).toBe(true);
    expect(options.headerLargeTitleStyle).toEqual({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
      color: Colours.light.moreImportantText,
    });
  });

  it("has no large title on iOS 18 or Android", () => {
    setPlatform("ios", "18.4");
    expect(largeTitleHeaderOptions("light")).toEqual(
      solidHeaderOptions("light"),
    );
    setPlatform("android", 36);
    expect(largeTitleHeaderOptions("dark")).toEqual(solidHeaderOptions("dark"));
  });
});
