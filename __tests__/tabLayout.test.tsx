import TabLayout from "@/app/(tabs)/_layout";
import { render } from "@testing-library/react-native";
import React from "react";

type ScreenProps = {
  name: string;
  options: {
    title: string;
    tabBarIcon: (args: {
      focused: boolean;
      color: string;
      size: number;
    }) => React.ReactElement;
  };
};

const mockScreens: ScreenProps[] = [];
jest.mock("expo-router", () => {
  const Tabs = ({ children }: { children?: React.ReactNode }) => children;
  Tabs.Screen = (props: ScreenProps) => {
    mockScreens.push(props);
    return null;
  };
  return {
    Tabs,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    DarkTheme: {},
    DefaultTheme: {},
  };
});
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => <Text>{name}</Text> };
});

describe("TabLayout", () => {
  beforeEach(() => {
    mockScreens.length = 0;
  });

  it("declares one Expo Router tab per tab file, titled for the user", async () => {
    await render(<TabLayout />);

    expect(mockScreens.map(({ name, options }) => [name, options.title])).toEqual([
      ["index", "Events"],
      ["favourites", "Favourites"],
      ["prayer", "Prayer"],
      ["about", "About"],
      ["help", "Help"],
    ]);
  });

  it("fills a tab's icon when it is focused", async () => {
    await render(<TabLayout />);
    const prayer = mockScreens.find(({ name }) => name === "prayer")!;
    const icon = (focused: boolean) =>
      (
        prayer.options.tabBarIcon({ focused, color: "red", size: 20 }) as any
      ).props.name;

    expect(icon(true)).toBe("book");
    expect(icon(false)).toBe("book-outline");
  });
});
