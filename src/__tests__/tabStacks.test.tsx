import EventsLayout from "@/app/(tabs)/(events)/_layout";
import FavouritesLayout from "@/app/(tabs)/favourites/_layout";
import ParishLayout from "@/app/(tabs)/parish/_layout";
import PrayerLayout from "@/app/(tabs)/prayer/_layout";
import { render } from "@testing-library/react-native";
import React from "react";

const mockTabStack = jest.fn();
jest.mock("@/components/ui/TabStack", () => ({
  TabStack: (props: object) => {
    mockTabStack(props);
    return null;
  },
}));

beforeEach(() => mockTabStack.mockClear());

describe("tab stacks", () => {
  it("gives Events an empty title and no large title", async () => {
    await render(<EventsLayout />);

    expect(mockTabStack).toHaveBeenCalledWith({ title: "" });
  });

  it.each([
    ["Favourites", FavouritesLayout],
    ["Prayer", PrayerLayout],
    ["Parish", ParishLayout],
  ])("gives %s a large title", async (title, Layout) => {
    await render(<Layout />);

    expect(mockTabStack).toHaveBeenCalledWith({ title, largeTitle: true });
  });
});
