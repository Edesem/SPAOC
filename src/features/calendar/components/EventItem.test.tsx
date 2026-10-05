import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { EventItem } from "./EventItem";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFavouritesStore } from "../favourites";
import {
  addFavourite,
  removeFavourite,
} from "../favourites/favouritesRepository";

// The store runs for real; only the repository's writes are observed.
jest.mock("../favourites/favouritesRepository", () => ({
  ...jest.requireActual("../favourites/favouritesRepository"),
  addFavourite: jest.fn(),
  removeFavourite: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium", Rigid: "rigid" },
}));

// Render icons as their name so the star state can be asserted and pressed.
jest.mock("react-native-vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const Icon = ({ name }: { name: string }) =>
    React.createElement(Text, null, name);
  return Icon;
});

const event = {
  id: "event-1",
  title: "Divine Liturgy",
  start: "2099-08-15T10:00:00.000Z",
  end: "2099-08-15T12:00:00.000Z",
  allDay: false,
  description: "",
  location: "",
  source: "church",
};

const renderItem = (
  props: { onUnfavourite?: () => void } = {},
  item = event,
) => render(<EventItem item={item} onPress={jest.fn()} {...props} />);

const initialState = useFavouritesStore.getState();

describe("EventItem dates", () => {
  // Jest runs as a device in Los Angeles (jest.global-setup.js), where this
  // instant is still the evening of 14 August.
  it("shows the event's date in parish time, not the device's time zone", async () => {
    const { getByText } = await render(
      <EventItem
        item={{ ...event, start: "2099-08-15T00:00:00.000Z" }}
        onPress={jest.fn()}
        showFullDate
      />,
    );

    expect(getByText("Sat, Aug 15, 2099")).toBeTruthy();
  });
});

describe("EventItem favourites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFavouritesStore.setState(initialState, true);
    (addFavourite as jest.Mock).mockResolvedValue(undefined);
    (removeFavourite as jest.Mock).mockResolvedValue(undefined);
  });

  it("shows a filled star when the store has the event as a favourite", async () => {
    useFavouritesStore.setState({ favourites: { [event.id]: event } });

    const { findByText } = await renderItem();

    expect(await findByText("star")).toBeTruthy();
  });

  it("shows an empty star when the event is not a favourite", async () => {
    const { findByText } = await renderItem();

    expect(await findByText("star-outline")).toBeTruthy();
  });

  it("does not read storage when rendering", async () => {
    useFavouritesStore.setState({ favourites: { [event.id]: event } });
    (AsyncStorage.getItem as jest.Mock).mockClear();

    await renderItem();
    await renderItem({}, { ...event, id: "event-2" });

    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
  });

  it("favourites the event through the store", async () => {
    const { findByText } = await renderItem();
    await fireEvent.press(await findByText("star-outline"));

    expect(await findByText("star")).toBeTruthy();
    expect(addFavourite).toHaveBeenCalledWith(event);
    expect(removeFavourite).not.toHaveBeenCalled();
    expect(useFavouritesStore.getState().isFavourite(event)).toBe(true);
  });

  it("unfavourites the event and notifies the parent", async () => {
    useFavouritesStore.setState({ favourites: { [event.id]: event } });
    const onUnfavourite = jest.fn();

    const { findByText } = await renderItem({ onUnfavourite });
    await fireEvent.press(await findByText("star"));

    expect(await findByText("star-outline")).toBeTruthy();
    expect(removeFavourite).toHaveBeenCalledWith(event);
    expect(addFavourite).not.toHaveBeenCalled();
    expect(onUnfavourite).toHaveBeenCalledTimes(1);
    expect(useFavouritesStore.getState().isFavourite(event)).toBe(false);
  });

  it("does not notify the parent when favouriting", async () => {
    const onUnfavourite = jest.fn();

    const { findByText } = await renderItem({ onUnfavourite });
    await fireEvent.press(await findByText("star-outline"));

    await waitFor(() => expect(addFavourite).toHaveBeenCalled());
    expect(onUnfavourite).not.toHaveBeenCalled();
  });

  it("updates every row showing the same event", async () => {
    const { findAllByText } = await render(
      <>
        <EventItem item={event} onPress={jest.fn()} />
        <EventItem item={event} onPress={jest.fn()} />
      </>,
    );
    const [first] = await findAllByText("star-outline");
    await fireEvent.press(first);

    await waitFor(async () =>
      expect(await findAllByText("star")).toHaveLength(2),
    );
  });

  it("keeps the star unchanged and logs when saving fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const failure = new Error("storage unavailable");
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
});

describe("EventItem time label", () => {
  it("shows 'All day' for an all-day event", async () => {
    const { findByText, queryByText } = await renderItem(
      {},
      {
        ...event,
        start: "2099-08-14T14:00:00.000Z",
        end: "2099-08-15T14:00:00.000Z",
        allDay: true,
      },
    );

    expect(await findByText(/All day/)).toBeTruthy();
    expect(queryByText(/ to /)).toBeNull();
  });

  it("shows the start and end times for a timed event", async () => {
    const { findByText, queryByText } = await renderItem();

    expect(await findByText(/ to /)).toBeTruthy();
    expect(queryByText(/All day/)).toBeNull();
  });
});

describe("EventItem navigation", () => {
  it("opens the details screen with the raw event, not formatted times", async () => {
    const onPress = jest.fn();
    const { findByText } = await render(
      <EventItem item={event} onPress={onPress} />,
    );

    await fireEvent.press(await findByText("Divine Liturgy"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/eventDetails",
      params: {
        id: "event-1",
        title: "Divine Liturgy",
        start: event.start,
        end: event.end,
        allDay: "false",
        description: "",
        location: "",
        source: "church",
      },
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
