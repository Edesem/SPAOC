import React from "react";
import { act, render, fireEvent, screen, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colours } from "@/theme/colours";
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

const EMPTY_MESSAGE =
  "No favourites yet. Tap the star on an event to save it here.";

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
    // clearAllMocks leaves queued once-values, which would leak between tests.
    mockRemoveExpired.mockReset();
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

    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
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

    expect(getByText(EMPTY_MESSAGE)).toHaveStyle({
      fontFamily: fontFamily.sans,
    });
  });

  describe("divider", () => {
    const dividers = () =>
      screen.getAllByTestId("ornamental-divider", { hidden: true });

    it("separates the subtitle from the list, in the secondary colour", async () => {
      (mockRemoveExpired).mockResolvedValue([
        event("event-1", "Divine Liturgy"),
      ]);

      await render(React.createElement(FavouritesScreen));
      await screen.findByTestId("event-item-event-1");

      expect(dividers()).toHaveLength(1);
      const rules = screen.getAllByTestId("ornamental-divider-rule", {
        hidden: true,
      });
      expect(rules).toHaveLength(2);
      rules.forEach((rule) =>
        expect(rule).toHaveStyle({ backgroundColor: Colours.light.secondary }),
      );
    });

    it("lines up with the row cards' 16pt inset, as on Prayer and Parish", async () => {
      (mockRemoveExpired).mockResolvedValue([]);

      await render(React.createElement(FavouritesScreen));

      expect(StyleSheet.flatten(dividers()[0].props.style)).toMatchObject({
        marginHorizontal: 16,
        marginVertical: 12,
      });
    });

    it("is still drawn when there are no favourites", async () => {
      (mockRemoveExpired).mockResolvedValue([]);

      await render(React.createElement(FavouritesScreen));

      expect(dividers()).toHaveLength(1);
    });
  });

  it("sets the empty state as the italic aside in the detail colour, like Prayer", async () => {
    (mockRemoveExpired).mockResolvedValue([]);

    const { getByText } = await render(React.createElement(FavouritesScreen));

    await waitFor(() => {
      expect(mockRemoveExpired).toHaveBeenCalled();
    });

    expect(getByText(EMPTY_MESSAGE)).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontStyle: "italic",
      textAlign: "center",
      color: Colours.light.detail,
    });
  });

  describe("page end", () => {
    // The scroll view is the first view, so walk up from the subtitle.
    const scrollView = () => {
      let node = screen.getByText(/Saved upcoming events/).parent;
      while (node && !node.props.contentContainerStyle) node = node.parent;
      if (!node) throw new Error("No scroll view");
      return node;
    };

    it("leaves 120 below the last row so it clears the tab bar, as Prayer and Home do", async () => {
      (mockRemoveExpired).mockResolvedValue([]);

      await render(React.createElement(FavouritesScreen));

      expect(
        StyleSheet.flatten(scrollView().props.contentContainerStyle)
          .paddingBottom,
      ).toBe(120);
    });

    it("keeps the readable gutter beside the content", async () => {
      (mockRemoveExpired).mockResolvedValue([]);

      await render(React.createElement(FavouritesScreen));

      expect(
        StyleSheet.flatten(scrollView().props.contentContainerStyle),
      ).toHaveProperty("paddingHorizontal");
    });

    it("draws the Seraph at 150 in the primary colour, as Prayer draws its cross", async () => {
      (mockRemoveExpired).mockResolvedValue([]);

      await render(React.createElement(FavouritesScreen));

      expect(screen.getByTestId("favourites-bottom-image")).toHaveStyle({
        width: 150,
        height: 150,
        tintColor: Colours.light.primary,
      });
    });

    it("sits the image 10 below the content without stretching to fill the page", async () => {
      (mockRemoveExpired).mockResolvedValue([]);

      await render(React.createElement(FavouritesScreen));

      const block = StyleSheet.flatten(
        screen.getByTestId("favourites-bottom-image").parent?.props.style,
      );
      expect(block.marginTop).toBe(10);
      expect(block.flex).toBeUndefined();
    });
  });

  describe("pull to refresh", () => {
    // The RefreshControl element is a prop of the scroll view that wraps
    // everything on the screen, so walk up from the subtitle to find it.
    const refreshControl = () => {
      let node = screen.getByText(/Saved upcoming events/).parent;
      while (node && !node.props.refreshControl) node = node.parent;
      if (!node) throw new Error("No scroll view with a refresh control");
      return node.props.refreshControl;
    };

    it("tints the pull-to-refresh spinner with the primary colour", async () => {
      (mockRemoveExpired).mockResolvedValue([]);

      await render(React.createElement(FavouritesScreen));

      expect(refreshControl().props.colors).toEqual([Colours.light.primary]);
    });

    it("loads the favourites again and shows what changed", async () => {
      (mockRemoveExpired)
        .mockResolvedValueOnce([event("event-1", "Divine Liturgy")])
        .mockResolvedValueOnce([event("event-2", "Vespers")]);

      await render(React.createElement(FavouritesScreen));
      await screen.findByTestId("event-item-event-1");

      await act(async () => refreshControl().props.onRefresh());

      expect(mockRemoveExpired).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("event-item-event-2")).toBeTruthy();
      expect(screen.queryByTestId("event-item-event-1")).toBeNull();
    });

    it("spins while it loads and stops when it is done", async () => {
      (mockRemoveExpired).mockResolvedValueOnce([]);
      let finish: (items: unknown[]) => void = () => {};
      (mockRemoveExpired).mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );

      await render(React.createElement(FavouritesScreen));
      expect(refreshControl().props.refreshing).toBe(false);

      let pull: Promise<void> = Promise.resolve();
      await act(async () => {
        pull = refreshControl().props.onRefresh();
      });
      expect(refreshControl().props.refreshing).toBe(true);

      await act(async () => {
        finish([]);
        await pull;
      });
      expect(refreshControl().props.refreshing).toBe(false);
    });

    it("stops spinning when loading fails", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      (mockRemoveExpired).mockResolvedValueOnce([]);
      (mockRemoveExpired).mockRejectedValueOnce(new Error("boom"));

      await render(React.createElement(FavouritesScreen));
      await act(async () => refreshControl().props.onRefresh());

      expect(refreshControl().props.refreshing).toBe(false);
      consoleError.mockRestore();
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

    expect(getByText(EMPTY_MESSAGE)).toBeTruthy();
    consoleError.mockRestore();
  });
});
