import AboutLayout from "@/app/(tabs)/about/_layout";
import EventsLayout from "@/app/(tabs)/(events)/_layout";
import FavouritesLayout from "@/app/(tabs)/favourites/_layout";
import HelpLayout from "@/app/(tabs)/help/_layout";
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
    ["About", AboutLayout],
    ["Help & Support", HelpLayout],
  ])("gives %s a large title", async (title, Layout) => {
    await render(<Layout />);

    expect(mockTabStack).toHaveBeenCalledWith({ title, largeTitle: true });
  });
});
