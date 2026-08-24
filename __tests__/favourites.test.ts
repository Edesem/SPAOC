import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FavouritesScreen from "@/app/(tabs)/favourites";

// TODO: These tests are not deterministic.
// Currently they are set to 2099 but technically 
// there will be a date where these test cases start failing
// For now is this good, however setting the clock to be a set date
// caused many errors and so this is the solution for the
// time being.

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),

  setItem: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");

  const SafeArea = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);

  return {
    SafeAreaProvider: SafeArea,
    SafeAreaView: SafeArea,
  };
});

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
  const { Text } = require("react-native");

  return {
    EventItem: ({
      item,
      onUnfavourite,
    }: {
      item: { id: string; title: string };
      onUnfavourite: () => void;
    }) =>
      React.createElement(
        Text,
        {
          testID: `event-item-${item.id}`,
          onPress: onUnfavourite,
        },
        item.title,
      ),
  };
});

describe("favourites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads stored upcoming favourites", async () => {
    const favourite = {
      id: "event-1",
      title: "Divine Liturgy",
      start: "2099-08-15T10:00:00.000Z",
      end: "2099-08-15T12:00:00.000Z",
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        [favourite.id]: favourite,
      }),
    );

    const { findByTestId } = await render(React.createElement(FavouritesScreen));

    expect(await findByTestId("event-item-event-1")).toBeTruthy();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "favourites",
      JSON.stringify({ [favourite.id]: favourite }),
    );
  });

  it("displays an empty state when storage is empty", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { getByText } = await render(React.createElement(FavouritesScreen));

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("favourites");
    });

    expect(getByText("No favourites yet.")).toBeTruthy();
  });

  it("unfavouriting removes the item from the displayed list", async () => {
    const eventBeingDeleted = {
      id: "event-1",
      title: "Event Being Removed",
      start: "2099-08-15T10:00:00.000Z",
      end: "2099-08-15T12:00:00.000Z",
    };

    const eventStaying = {
      id: "event-2",
      title: "Current Event",
      start: "2099-08-16T10:00:00.000Z",
      end: "2099-08-16T12:00:00.000Z",
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        [eventBeingDeleted.id]: eventBeingDeleted,
        [eventStaying.id]: eventStaying,
      }),
    );

    const { findByTestId, getByTestId, queryByTestId } = await render(
      React.createElement(FavouritesScreen),
    );

    expect(await findByTestId("event-item-event-1")).toBeTruthy();
    expect(getByTestId("event-item-event-2")).toBeTruthy();

    fireEvent.press(getByTestId("event-item-event-1"));

    await waitFor(() => {
      expect(queryByTestId("event-item-event-1")).toBeNull();
    });
    expect(getByTestId("event-item-event-2")).toBeTruthy();
  });

  it("removes expired favourites from storage and the displayed list", async () => {
    const expiredFavourite = {
      id: "event-1",
      title: "Expired Event",
      start: "2000-08-15T10:00:00.000Z",
      end: "2000-08-15T12:00:00.000Z",
    };

    const currentFavourite = {
      id: "event-2",
      title: "Current Event",
      start: "2099-08-15T10:00:00.000Z",
      end: "2099-08-15T12:00:00.000Z",
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        [expiredFavourite.id]: expiredFavourite,
        [currentFavourite.id]: currentFavourite,
      }),
    );

    const { findByTestId, queryByTestId } = await render(
      React.createElement(FavouritesScreen),
    );

    expect(await findByTestId("event-item-event-2")).toBeTruthy();
    expect(queryByTestId("event-item-event-1")).toBeNull();

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "favourites",
        JSON.stringify({
          [currentFavourite.id]: currentFavourite,
        }),
      );
    });
  });

  it("shows the empty state and logs an error for invalid stored data", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("not valid JSON");

    const { getByText } = await render(React.createElement(FavouritesScreen));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to load favourites",
        expect.any(SyntaxError),
      );
    });

    expect(getByText("No favourites yet.")).toBeTruthy();
    consoleError.mockRestore();
  });
});
