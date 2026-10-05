import TabLayout from "@/app/(tabs)/_layout";
import { render } from "@testing-library/react-native";
import React from "react";

type Icon = { sf: { default: string; selected: string }; md: string };
type Trigger = { name: string; label: string; icon: Icon };

const mockTriggers: Trigger[] = [];
jest.mock("expo-router/unstable-native-tabs", () => {
  const passThrough = ({ children }: { children?: React.ReactNode }) =>
    children ?? null;

  const Icon = (props: Icon) => {
    mockCurrent.icon = props;
    return null;
  };
  const Label = ({ children }: { children: string }) => {
    mockCurrent.label = children;
    return null;
  };
  const Trigger = ({
    name,
    children,
  }: {
    name: string;
    children: React.ReactNode;
  }) => {
    mockCurrent = { name } as Trigger;
    mockTriggers.push(mockCurrent);
    return children;
  };
  Trigger.Icon = Icon;
  Trigger.Label = Label;

  const NativeTabs = passThrough as typeof passThrough & { Trigger: typeof Trigger };
  NativeTabs.Trigger = Trigger;
  return { NativeTabs };
});

let mockCurrent: Trigger;

describe("TabLayout", () => {
  beforeEach(() => {
    mockTriggers.length = 0;
  });

  it("declares one native tab per tab file, labelled for the user", async () => {
    await render(<TabLayout />);

    expect(mockTriggers.map(({ name, label }) => [name, label])).toEqual([
      ["index", "Events"],
      ["favourites", "Favourites"],
      ["prayer", "Prayer"],
      ["about", "About"],
      ["help", "Help"],
    ]);
  });

  it("gives every tab an iOS and an Android icon, filled when selected on iOS", async () => {
    await render(<TabLayout />);

    for (const { icon } of mockTriggers) {
      expect(icon.sf.default).toBeTruthy();
      expect(icon.md).toBeTruthy();
    }
    const prayer = mockTriggers.find(({ name }) => name === "prayer")!;
    expect(prayer.icon.sf).toEqual({ default: "book", selected: "book.fill" });
  });
});
