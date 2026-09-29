import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { EventItem } from "@/components/EventItem";
import {
  addFavourite,
  isFavourite,
  removeFavourite,
} from "@/services/favourites";

jest.mock("@/services/favourites", () => ({
  isFavourite: jest.fn(),
  addFavourite: jest.fn(),
  removeFavourite: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium", Rigid: "rigid" },
}));

// Render icons as their name so the star state can be asserted and pressed.
jest.mock("react-native-vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return ({ name }: { name: string }) => React.createElement(Text, null, name);
});

const event = {
  id: "event-1",
  title: "Divine Liturgy",
  start: "2099-08-15T10:00:00.000Z",
  end: "2099-08-15T12:00:00.000Z",
  description: "",
  location: "",
  source: "church",
  data: [],
};

const renderItem = (props: { onUnfavourite?: () => void } = {}) =>
  render(<EventItem item={event} onPress={jest.fn()} {...props} />);

describe("EventItem favourites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (addFavourite as jest.Mock).mockResolvedValue(undefined);
    (removeFavourite as jest.Mock).mockResolvedValue(undefined);
  });

  it("shows a filled star when the event is already a favourite", async () => {
    (isFavourite as jest.Mock).mockResolvedValue(true);

    const { findByText } = await renderItem();

    expect(await findByText("star")).toBeTruthy();
    expect(isFavourite).toHaveBeenCalledWith(event);
  });

  it("favourites the event through the repository", async () => {
    (isFavourite as jest.Mock).mockResolvedValue(false);

    const { findByText } = await renderItem();
    await fireEvent.press(await findByText("star-outline"));

    expect(await findByText("star")).toBeTruthy();
    expect(addFavourite).toHaveBeenCalledWith(event);
    expect(removeFavourite).not.toHaveBeenCalled();
  });

  it("unfavourites the event and notifies the parent", async () => {
    (isFavourite as jest.Mock).mockResolvedValue(true);
    const onUnfavourite = jest.fn();

    const { findByText } = await renderItem({ onUnfavourite });
    await fireEvent.press(await findByText("star"));

    expect(await findByText("star-outline")).toBeTruthy();
    expect(removeFavourite).toHaveBeenCalledWith(event);
    expect(addFavourite).not.toHaveBeenCalled();
    expect(onUnfavourite).toHaveBeenCalledTimes(1);
  });

  it("does not notify the parent when favouriting", async () => {
    (isFavourite as jest.Mock).mockResolvedValue(false);
    const onUnfavourite = jest.fn();

    const { findByText } = await renderItem({ onUnfavourite });
    await fireEvent.press(await findByText("star-outline"));

    await waitFor(() => expect(addFavourite).toHaveBeenCalled());
    expect(onUnfavourite).not.toHaveBeenCalled();
  });

  it("keeps the star unchanged and logs when saving fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const failure = new Error("storage unavailable");
    (isFavourite as jest.Mock).mockResolvedValue(false);
    (addFavourite as jest.Mock).mockRejectedValue(failure);

    const { findByText, getByText } = await renderItem();
    await fireEvent.press(await findByText("star-outline"));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to save favourite",
        failure,
      );
    });
    expect(getByText("star-outline")).toBeTruthy();
    consoleError.mockRestore();
  });

  it("shows an empty star and logs when loading fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const failure = new SyntaxError("bad JSON");
    (isFavourite as jest.Mock).mockRejectedValue(failure);

    const { getByText } = await renderItem();

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to load favourites",
        failure,
      );
    });
    expect(getByText("star-outline")).toBeTruthy();
    consoleError.mockRestore();
  });
});
