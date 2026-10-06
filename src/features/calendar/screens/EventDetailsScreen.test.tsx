import EventDetailsScreen from "./EventDetailsScreen";
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

describe("EventDetailsScreen times", () => {
  it("formats the raw start and end times itself", async () => {
    mockParams = params;

    const { findByText, queryByText } = await render(<EventDetailsScreen />);

    expect(await findByText(/\d{1,2}:\d{2}.* to \d{1,2}:\d{2}/)).toBeTruthy();
    expect(queryByText(/2099/)).toBeNull();
  });

  it("shows 'All day' for an all-day event", async () => {
    mockParams = { ...params, allDay: "true" };

    const { findByText } = await render(<EventDetailsScreen />);

    expect(await findByText(/All day/)).toBeTruthy();
  });
});
