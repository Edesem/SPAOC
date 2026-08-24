import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FavouritesScreen from "@/app/(tabs)/favourites";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),

  setItem: jest.fn(),
}));

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(callback, []);
    },
  };
});

jest.mock("@/components/EventItem", () => {
  const React = require("react");

  return {
    EventItem: ({ item }: { item: { title: string } }) =>
      React.createElement(React.Fragment, null, item.title),
  };
});

describe("favourites", () => {
  beforeEach(() => {
    jest.useFakeTimers();

    jest.clearAllMocks();

    jest.setSystemTime(new Date("2026-08-13T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should load stored favourites", async () => {
    const favourite = {
      id: "event-1",
      title: "Divine Liturgy",
      start: "2026-08-15T10:00:00.000Z",
      end: "2026-08-15T12:00:00.000Z",
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        [favourite.id]: favourite,
      }),
    );

    await act(async () => {
      render(React.createElement(FavouritesScreen));
      await Promise.resolve();
    });

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(expect.any(String));
  });

  it("displays no favourites when storage is empty", () => {});

  it("removes expired favourites", () => {});

  it("persists the removal of expired favourites", () => {});

  it("doesn’t crash when storage contains invalid JSON", () => {});

  it("unfavouriting removes the item from the displayed list", () => {});
});
