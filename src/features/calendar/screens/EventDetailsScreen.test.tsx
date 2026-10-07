import EventDetailsScreen from "./EventDetailsScreen";
import { fontFamily } from "@/theme/typography";
import { EventDetailsParams } from "@/types/routes";
import { render } from "@testing-library/react-native";
import React from "react";

let mockParams: EventDetailsParams;
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ setOptions: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
jest.mock("react-native-toast-message", () => ({ show: jest.fn() }));
jest.mock("@/components/ui/IconSymbol", () => ({ IconSymbol: () => null }));

const params: EventDetailsParams = {
  id: "event-1",
  title: "Divine Liturgy",
  start: "2099-08-15T10:00:00.000Z",
  end: "2099-08-15T12:00:00.000Z",
  allDay: "false",
  source: "church",
};

describe("EventDetailsScreen typography", () => {
  it("sets the title in the sans headline and the description in the sans body", async () => {
    mockParams = { ...params, description: "Bring a dish to share." };

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText("Divine Liturgy")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 25,
      fontWeight: "700",
    });
    expect(await findByText("Bring a dish to share.")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 17,
      lineHeight: 24,
    });
  });
});

describe("EventDetailsScreen times", () => {
  it("formats the raw start and end times itself", async () => {
    mockParams = params;

    const { findByText, queryByText } = await render(<EventDetailsScreen />);

    expect(await findByText(/\d{1,2}:\d{2}.* to \d{1,2}:\d{2}/)).toBeTruthy();
    expect(queryByText(/T\d{2}:\d{2}/)).toBeNull();
  });

  it("shows the day the event is on, in parish time", async () => {
    mockParams = params;

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText(/Saturday 15 August/)).toBeTruthy();
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

  it("shows 'All day' for an all-day event", async () => {
    mockParams = { ...params, allDay: "true" };

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText(/All day/)).toBeTruthy();
  });
});
