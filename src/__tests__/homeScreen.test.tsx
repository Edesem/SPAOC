import HomeScreen from "@/app/(tabs)/index";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { SectionList } from "react-native";

// The screen is tested against a fake useHomeFeature. What the feature
// returns is covered by useHomeFeature.test.ts and homeRules.test.ts.

const mockSetShowMonthPicker = jest.fn();
const mockOnValueChange = jest.fn();
const mockClearMonthFilter = jest.fn();
const mockOnRefresh = jest.fn();

const baseFeature = {
  todaysSaints: ["St. Test", "St. Other"],
  todaysSaintsTitle: "Today's Feasts",
  fastLoading: false,
  majorFastLabel: "Great Lent",
  minorFastLabel: "Fast free day",
  sections: [] as any[],
  refreshing: false,
  onRefresh: mockOnRefresh,
  selectedDate: new Date("2026-03-15T12:00:00.000Z"),
  isMonthFiltered: false,
  clearMonthFilter: mockClearMonthFilter,
  showMonthPicker: false,
  setShowMonthPicker: mockSetShowMonthPicker,
  onValueChange: mockOnValueChange,
};

let mockFeature: typeof baseFeature = baseFeature;
let mockTabPressListener: (() => void) | undefined;

jest.mock("@/hooks/useHomeFeature", () => ({
  useHomeFeature: () => mockFeature,
}));

jest.mock("expo-dev-client", () => ({}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  setOptions: jest.fn(),
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useNavigation: () => ({
    addListener: (_event: string, listener: () => void) => {
      mockTabPressListener = listener;
      return () => {
        mockTabPressListener = undefined;
      };
    },
  }),
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

jest.mock("react-native-month-year-picker", () => {
  const React = require("react");
  const { View } = require("react-native");

  return () => React.createElement(View, { testID: "month-picker" });
});

jest.mock("@/components/EventItem", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    EventItem: ({ item }: { item: { id: string } }) =>
      React.createElement(Text, null, `event ${item.id}`),
  };
});

const eventSection = (
  title: string,
  sectionIndex: number,
  data: { id: string }[],
  weekLabel?: string,
) => ({ title, weekLabel, sectionIndex, data });

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeature = baseFeature;
    mockTabPressListener = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the saints of the day and the fast labels above the events", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }])],
    };

    const { getByText } = await render(<HomeScreen />);

    expect(getByText("Today's Feasts")).toBeTruthy();
    expect(getByText("St. Test\nSt. Other")).toBeTruthy();
    expect(getByText("Great Lent")).toBeTruthy();
    expect(getByText("Fast free day")).toBeTruthy();
  });

  it("shows the top and bottom images around the events", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }])],
    };

    const { getByTestId } = await render(<HomeScreen />);

    expect(getByTestId("home-top-image")).toBeTruthy();
    expect(getByTestId("home-bottom-image")).toBeTruthy();
  });

  it("omits the major fast label when there is none", async () => {
    mockFeature = { ...baseFeature, majorFastLabel: "" };

    const { queryByText } = await render(<HomeScreen />);

    expect(queryByText("Great Lent")).toBeNull();
    expect(queryByText("Fast free day")).toBeTruthy();
  });

  it("shows each event section's title, week label and events", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [
        eventSection("Today", 0, [{ id: "1" }], "This Week"),
        eventSection("Tomorrow", 1, [{ id: "2" }]),
      ],
    };

    const { getByText } = await render(<HomeScreen />);

    expect(getByText("This Week")).toBeTruthy();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("event 1")).toBeTruthy();
    expect(getByText("Tomorrow")).toBeTruthy();
    expect(getByText("event 2")).toBeTruthy();
  });

  it("shows the empty message, with the header and footer, when there are no events", async () => {
    const { getByText, getByTestId } = await render(<HomeScreen />);

    expect(getByText("No events found.")).toBeTruthy();
    expect(getByText("Today's Feasts")).toBeTruthy();
    expect(getByTestId("home-top-image")).toBeTruthy();
    expect(getByTestId("home-bottom-image")).toBeTruthy();
  });

  it("does not show the empty message when there are events", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }])],
    };

    const { queryByText } = await render(<HomeScreen />);

    expect(queryByText("No events found.")).toBeNull();
  });

  describe("month filter", () => {
    it("shows the month picker button even when no events match", async () => {
      const { getByLabelText } = await render(<HomeScreen />);

      expect(getByLabelText("Choose month")).toBeTruthy();
    });

    it("opens the month picker when the button is pressed", async () => {
      const { getByLabelText } = await render(<HomeScreen />);

      await fireEvent.press(getByLabelText("Choose month"));

      expect(mockSetShowMonthPicker).toHaveBeenCalledWith(true);
    });

    it("renders a single month picker however many event sections there are", async () => {
      mockFeature = {
        ...baseFeature,
        showMonthPicker: true,
        sections: [
          eventSection("Today", 0, [{ id: "1" }]),
          eventSection("Tomorrow", 1, [{ id: "2" }]),
        ],
      };

      const { getAllByTestId } = await render(<HomeScreen />);

      expect(getAllByTestId("month-picker")).toHaveLength(1);
    });

    it("shows the month picker when no events match", async () => {
      mockFeature = { ...baseFeature, showMonthPicker: true };

      const { getAllByTestId } = await render(<HomeScreen />);

      expect(getAllByTestId("month-picker")).toHaveLength(1);
    });

    it("hides the clear button while no month is selected", async () => {
      const { queryByLabelText } = await render(<HomeScreen />);

      expect(queryByLabelText("Clear month filter")).toBeNull();
    });

    it("shows the clear button, with the empty message, when the month has no events", async () => {
      mockFeature = { ...baseFeature, isMonthFiltered: true };

      const { getByLabelText, getByText } = await render(<HomeScreen />);

      expect(getByLabelText("Clear month filter")).toBeTruthy();
      expect(getByText("No events found.")).toBeTruthy();
    });

    it("clears the month filter when the clear button is pressed", async () => {
      mockFeature = { ...baseFeature, isMonthFiltered: true };
      const { getByLabelText } = await render(<HomeScreen />);

      await fireEvent.press(getByLabelText("Clear month filter"));

      expect(mockClearMonthFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe("scrolling to the top", () => {
    const spyOnScrollTo = () => {
      const scrollTo = jest.fn();
      jest
        .spyOn(SectionList.prototype, "getScrollResponder")
        .mockReturnValue({ scrollTo } as any);
      return scrollTo;
    };

    it("scrolls to the very top when the button is pressed, even with no events", async () => {
      const scrollTo = spyOnScrollTo();
      const { getByLabelText } = await render(<HomeScreen />);

      await fireEvent.press(getByLabelText("Scroll to top"));

      expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
    });

    it("scrolls to the very top when the Home tab is pressed", async () => {
      const scrollTo = spyOnScrollTo();
      await render(<HomeScreen />);

      mockTabPressListener?.();

      expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
    });
  });
});
