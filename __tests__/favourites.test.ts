import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FavouritesScreen from "@/app/(tabs)/favourites";
import { removeExpiredFavourites } from "@/services/favourites";

// The screen is tested against a mocked favourites repository. Storage
// format, expiry boundaries and invalid stored data are covered by
// services/favourites/favouritesRepository.test.ts.

// TODO:
// ⚠️ Test coverage gaps:
// - onPress behaviour ❌
//   You’re mocking it as a no-op.
// - Missing/invalid event dates ❌
//   Not tested.
// - Component rendering details ❌
//   Header, subtitle, image etc. aren’t tested.

jest.mock("@/services/favourites", () => ({
  removeExpiredFavourites: jest.fn(),
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
      item: { id?: string; title: string };
      onUnfavourite: () => void;
    }) =>
      React.createElement(
        Text,
        {
          testID: `event-item-${item.id ?? item.title}`,
          onPress: onUnfavourite,
        },
        item.title,
      ),
  };
});

const event = (id: string, title: string) => ({
  id,
  title,
  start: "2099-08-15T10:00:00.000Z",
  end: "2099-08-15T12:00:00.000Z",
});

describe("favourites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("cleans up expired favourites and shows the upcoming ones on focus", async () => {
    (removeExpiredFavourites as jest.Mock).mockResolvedValue([
      event("event-1", "Divine Liturgy"),
    ]);

    const { findByTestId } = await render(React.createElement(FavouritesScreen));

    expect(await findByTestId("event-item-event-1")).toBeTruthy();
    expect(removeExpiredFavourites).toHaveBeenCalledTimes(1);
  });

  it("does not read or write favourites storage directly", async () => {
    (removeExpiredFavourites as jest.Mock).mockResolvedValue([
      event("event-1", "Divine Liturgy"),
    ]);

    const { findByTestId } = await render(React.createElement(FavouritesScreen));
    await findByTestId("event-item-event-1");

    expect(AsyncStorage.getItem).not.toHaveBeenCalledWith("favourites");
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
      "favourites",
      expect.anything(),
    );
  });

  it("displays an empty state when there are no favourites", async () => {
    (removeExpiredFavourites as jest.Mock).mockResolvedValue([]);

    const { getByText } = await render(React.createElement(FavouritesScreen));

    await waitFor(() => {
      expect(removeExpiredFavourites).toHaveBeenCalled();
    });

    expect(getByText("No favourites yet.")).toBeTruthy();
  });

  it("unfavouriting removes the item from the displayed list", async () => {
    (removeExpiredFavourites as jest.Mock).mockResolvedValue([
      event("event-1", "Event Being Removed"),
      event("event-2", "Current Event"),
    ]);

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

  it("unfavouriting an event without an id removes it by title", async () => {
    const { id: _, ...vespers } = event("unused", "Vespers");
    (removeExpiredFavourites as jest.Mock).mockResolvedValue([
      vespers,
      event("event-2", "Current Event"),
    ]);

    const { findByTestId, getByTestId, queryByTestId } = await render(
      React.createElement(FavouritesScreen),
    );

    fireEvent.press(await findByTestId("event-item-Vespers"));

    await waitFor(() => {
      expect(queryByTestId("event-item-Vespers")).toBeNull();
    });
    expect(getByTestId("event-item-event-2")).toBeTruthy();
  });

  it("shows the empty state and logs an error when loading fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const error = new SyntaxError("Unexpected token");
    (removeExpiredFavourites as jest.Mock).mockRejectedValue(error);

    const { getByText } = await render(React.createElement(FavouritesScreen));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to load favourites",
        error,
      );
    });

    expect(getByText("No favourites yet.")).toBeTruthy();
    consoleError.mockRestore();
  });
});
