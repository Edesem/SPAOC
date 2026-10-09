import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fontFamily } from "@/theme/typography";
import { StyleSheet } from "react-native";
import FavouritesScreen from "./FavouritesScreen";

// The screen is tested against a mocked favourites store. Storage format,
// expiry boundaries and invalid stored data are covered by
// favourites/favouritesRepository.test.ts, and the store's own
// behaviour by favourites/favouritesStore.test.ts.

// TODO:
// ⚠️ Test coverage gaps:
// - onPress behaviour ❌
//   You’re mocking it as a no-op.
// - Missing/invalid event dates ❌
//   Not tested.
// - Component rendering details ❌
//   Header, subtitle, image etc. aren’t tested.

const mockRemoveExpired = jest.fn();

jest.mock("../favourites", () => ({
  useFavouritesStore: {
    getState: () => ({ removeExpired: mockRemoveExpired }),
  },
}));

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    useFocusEffect: (callback: () => void) => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount, like a focus
      React.useEffect(callback, []);
    },
  };
});

jest.mock("../components/EventItem", () => {
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
    (mockRemoveExpired).mockResolvedValue([
      event("event-1", "Divine Liturgy"),
    ]);

    const { findByTestId } = await render(React.createElement(FavouritesScreen));

    expect(await findByTestId("event-item-event-1")).toBeTruthy();
    expect(mockRemoveExpired).toHaveBeenCalledTimes(1);
  });

  it("does not read or write favourites storage directly", async () => {
    (mockRemoveExpired).mockResolvedValue([
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
    (mockRemoveExpired).mockResolvedValue([]);

    const { getByText } = await render(React.createElement(FavouritesScreen));

    await waitFor(() => {
      expect(mockRemoveExpired).toHaveBeenCalled();
    });

    expect(getByText("No favourites yet.")).toBeTruthy();
  });

  it("left-aligns the subtitle, in line with the header title", async () => {
    (mockRemoveExpired).mockResolvedValue([]);

    const { getByText } = await render(React.createElement(FavouritesScreen));

    expect(
      getByText("Saved upcoming events will appear here for quick viewing."),
    ).toHaveStyle({ textAlign: "left" });
  });

  it("sets the subtitle upright in the sans at 19, not italic", async () => {
    (mockRemoveExpired).mockResolvedValue([]);

    const { getByText } = await render(React.createElement(FavouritesScreen));

    const subtitle = StyleSheet.flatten(
      getByText("Saved upcoming events will appear here for quick viewing.")
        .props.style,
    );
    expect(subtitle).toMatchObject({
      fontFamily: fontFamily.sans,
      fontSize: 19,
    });
    expect(subtitle.fontStyle).toBeUndefined();
  });

  it("sets the empty state in the sans rather than the system font", async () => {
    (mockRemoveExpired).mockResolvedValue([]);

    const { getByText } = await render(React.createElement(FavouritesScreen));

    await waitFor(() => {
      expect(mockRemoveExpired).toHaveBeenCalled();
    });

    expect(getByText("No favourites yet.")).toHaveStyle({
      fontFamily: fontFamily.sans,
    });
  });

  it("unfavouriting removes the item from the displayed list", async () => {
    (mockRemoveExpired).mockResolvedValue([
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
    (mockRemoveExpired).mockResolvedValue([
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
    (mockRemoveExpired).mockRejectedValue(error);

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
