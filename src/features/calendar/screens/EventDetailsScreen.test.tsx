import EventDetailsScreen from "./EventDetailsScreen";
import { getCalendarColour } from "@/domain/calendarSources";
import { resetNow, setNow } from "@/lib/parishTime";
import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
import { EventDetailsParams } from "@/types/routes";
import { act, fireEvent, render } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { Linking, Platform, processColor } from "react-native";
import Toast from "react-native-toast-message";
import { useFavouritesStore } from "../favourites";

let mockParams: EventDetailsParams;
jest.mock("expo-router", () => ({
  ...require("@/testing/expoRouterStack").createStackMock(),
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ setOptions: jest.fn() }),
}));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
jest.mock("react-native-toast-message", () => ({ show: jest.fn() }));
jest.mock("@/components/ui/IconSymbol", () => ({ IconSymbol: () => null }));

// The marker is hidden from screen readers, so queries must include it.
const HIDDEN = { includeHiddenElements: true };

// 20:00 to 22:00 in Melbourne (AEST, UTC+10) on Saturday 15 August.
const params: EventDetailsParams = {
  id: "event-1",
  title: "Divine Liturgy",
  start: "2099-08-15T10:00:00.000Z",
  end: "2099-08-15T12:00:00.000Z",
  allDay: "false",
  source: "church",
};

const withLocation: EventDetailsParams = {
  ...params,
  location: "32-34 Plunkett Rd, Dandenong VIC 3175",
};

// The year is shown only when it isn't the current one.
beforeEach(() => {
  setNow(() => new Date("2099-06-01T00:00:00.000Z"));
  jest.clearAllMocks();
  useFavouritesStore.setState({ favourites: {} });
});

afterEach(resetNow);

describe("EventDetailsScreen header of the page", () => {
  it("sets the date in red italic small capitals at normal weight", async () => {
    mockParams = params;

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText("Saturday, 15 August")).toHaveStyle({
      fontFamily: fontFamily.smallCaps,
      fontStyle: "italic",
      fontWeight: "400",
      color: Colours.light.commemorate,
    });
  });

  it("puts the calendar's diamond marker beside the date", async () => {
    mockParams = params;

    const { findByTestId } = await render(<EventDetailsScreen />);

    const shape = await findByTestId("calendar-marker-shape", HIDDEN);
    expect(shape.props.fill.payload).toBe(
      processColor(getCalendarColour("church")),
    );
  });

  it("sets the title in the serif display face", async () => {
    mockParams = params;

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText("Divine Liturgy")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontSize: 30,
      fontWeight: "700",
      color: Colours.light.moreImportantText,
    });
  });
});

describe("EventDetailsScreen times", () => {
  it("shows the times on one line with am or pm once", async () => {
    mockParams = params;

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText("8:00 – 10:00 pm")).toBeTruthy();
  });

  it("shows 'All day' for an all-day event", async () => {
    mockParams = { ...params, allDay: "true" };

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText("All day")).toBeTruthy();
  });

  it("shows the day the event is on, in parish time", async () => {
    mockParams = params;

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText("Saturday, 15 August")).toBeTruthy();
  });
});

describe("EventDetailsScreen location", () => {
  it("shows the address with Directions and Copy address buttons", async () => {
    mockParams = withLocation;

    const { findByText, findByRole } = await render(<EventDetailsScreen />);

    expect(
      await findByText("32-34 Plunkett Rd, Dandenong VIC 3175"),
    ).toBeTruthy();
    expect(await findByRole("button", { name: "Directions" })).toBeTruthy();
    expect(await findByRole("button", { name: "Copy address" })).toBeTruthy();
  });

  it("copies the address and confirms it", async () => {
    mockParams = withLocation;

    const { findByRole } = await render(<EventDetailsScreen />);
    fireEvent.press(await findByRole("button", { name: "Copy address" }));

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
      "32-34 Plunkett Rd, Dandenong VIC 3175",
    );
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: "Address copied!" }),
    );
  });

  it("opens the map app for Directions", async () => {
    mockParams = withLocation;
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    const { findByRole } = await render(<EventDetailsScreen />);
    await act(async () => {
      fireEvent.press(await findByRole("button", { name: "Directions" }));
    });

    expect(openURL).toHaveBeenCalledWith(
      expect.stringContaining("maps.apple.com"),
    );
  });

  it("leaves the whole location block out when there is no location", async () => {
    mockParams = params;

    const { findByText, queryByText, queryByRole } = await render(
      <EventDetailsScreen />,
    );

    await findByText("Divine Liturgy");
    expect(queryByText("Directions")).toBeNull();
    expect(queryByRole("button", { name: "Copy address" })).toBeNull();
  });
});

describe("EventDetailsScreen Directions encoding", () => {
  // A space, a comma and an ampersand: the characters a map query can break on.
  const trickyLocation = "Hall & Garden, 32 Plunkett Rd";
  const encoded = "Hall%20%26%20Garden%2C%2032%20Plunkett%20Rd";

  afterEach(() => jest.restoreAllMocks());

  const pressDirections = async (installed: string[]) => {
    mockParams = { ...params, location: trickyLocation };
    jest
      .spyOn(Linking, "canOpenURL")
      .mockImplementation(async (url) => installed.includes(url));
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    const { findByRole } = await render(<EventDetailsScreen />);
    await act(async () => {
      fireEvent.press(await findByRole("button", { name: "Directions" }));
    });

    return openURL;
  };

  it("encodes the address once for Waze", async () => {
    const openURL = await pressDirections(["waze://"]);

    expect(openURL).toHaveBeenCalledWith(`waze://?q=${encoded}&navigate=yes`);
  });

  it("encodes the address once for Google Maps", async () => {
    const openURL = await pressDirections(["comgooglemaps://"]);

    expect(openURL).toHaveBeenCalledWith(`comgooglemaps://?q=${encoded}`);
  });

  it("encodes the address once for Apple Maps", async () => {
    const openURL = await pressDirections([]);

    expect(openURL).toHaveBeenCalledWith(`http://maps.apple.com/?q=${encoded}`);
  });

  it("encodes the address once for Android's geo link", async () => {
    jest
      .spyOn(Platform, "select")
      .mockImplementation((spec) => (spec as { android?: unknown }).android);

    const openURL = await pressDirections([]);

    expect(openURL).toHaveBeenCalledWith(`geo:0,0?q=${encoded}`);
  });
});

describe("EventDetailsScreen description", () => {
  it("sets the description in the sans body", async () => {
    mockParams = { ...params, description: "Bring a dish to share." };

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText("Bring a dish to share.")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 17,
      lineHeight: 24,
    });
  });

  it("shows a link in the description as its site name", async () => {
    mockParams = {
      ...params,
      description: "RSVP at https://www.stpaulchurch.com.au/rsvp?id=4.",
    };

    const { findByLabelText, queryByText } = await render(
      <EventDetailsScreen />,
    );

    expect(
      await findByLabelText("Open link to stpaulchurch.com.au"),
    ).toBeTruthy();
    expect(queryByText(/rsvp\?id=4/)).toBeNull();
  });

  it("says nothing when there is no description", async () => {
    mockParams = params;

    const { findByText, queryByText } = await render(<EventDetailsScreen />);

    await findByText("Divine Liturgy");
    expect(queryByText("No description available")).toBeNull();
  });
});

describe("EventDetailsScreen favourite star", () => {
  it("adds the event to favourites and flips its label", async () => {
    mockParams = params;

    const { findByRole } = await render(<EventDetailsScreen />);
    await act(async () => {
      fireEvent.press(
        await findByRole("button", {
          name: "Add Divine Liturgy to favourites",
        }),
      );
    });

    expect(useFavouritesStore.getState().favourites["event-1"]).toEqual(
      expect.objectContaining({ id: "event-1", title: "Divine Liturgy" }),
    );
    expect(
      await findByRole("button", {
        name: "Remove Divine Liturgy from favourites",
      }),
    ).toBeTruthy();
  });

  it("removes a favourite that is already saved", async () => {
    mockParams = params;
    await useFavouritesStore.getState().toggle({
      id: "event-1",
      title: "Divine Liturgy",
      start: params.start,
      end: params.end,
      allDay: false,
      description: "",
      location: "",
      source: "church",
    });

    const { findByRole } = await render(<EventDetailsScreen />);
    await act(async () => {
      fireEvent.press(
        await findByRole("button", {
          name: "Remove Divine Liturgy from favourites",
        }),
      );
    });

    expect(useFavouritesStore.getState().favourites["event-1"]).toBeUndefined();
  });
});

describe("EventDetailsScreen image", () => {
  it("keeps the calendar's image, tinted, at the bottom", async () => {
    mockParams = params;

    const { findByTestId } = await render(<EventDetailsScreen />);

    const image = await findByTestId("event-image", HIDDEN);
    expect(image.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tintColor: Colours.light.primary }),
      ]),
    );
  });
});
