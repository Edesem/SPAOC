import { resetNow, setNow } from "@/lib/parishTime";
import { fontFamily } from "@/theme/typography";
import HomeScreen from "./HomeScreen";
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
  loadErrorMessage: null as string | null,
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

jest.mock("../hooks/useHomeFeature", () => ({
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

  return (props: object) =>
    React.createElement(View, { ...props, testID: "month-picker" });
});

jest.mock("../components/EventItem", () => {
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

  it("sets the saint and fasting headings in the serif, the liturgical voice", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }])],
    };

    const { getByText } = await render(<HomeScreen />);

    expect(getByText("Today's Feasts")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
    expect(getByText("Great Lent")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
    expect(getByText("St. Test\nSt. Other")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontSize: 19,
    });
    expect(getByText("Fast free day")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontSize: 19,
    });
  });

  it("sets the week label and day headers in the sans, the noticeboard voice", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }], "This week")],
    };

    const { getByText } = await render(<HomeScreen />);

    expect(getByText("This week")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontWeight: "700",
    });
    expect(getByText("Today")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 19,
    });
  });

  it("shows no load error message when everything loads", async () => {
    const { queryByRole } = await render(<HomeScreen />);

    expect(queryByRole("alert")).toBeNull();
  });

  it("shows the load error message without hiding the rest of Home", async () => {
    mockFeature = {
      ...baseFeature,
      loadErrorMessage: "Couldn't load events. Pull down to retry.",
    };

    const { getByRole, getByText } = await render(<HomeScreen />);

    expect(getByRole("alert")).toHaveTextContent(
      "Couldn't load events. Pull down to retry.",
    );
    expect(getByText("Today's Feasts")).toBeTruthy();
    expect(getByText("Great Lent")).toBeTruthy();
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

    it("stops the month picker at the app clock's today", async () => {
      const pinned = new Date("2026-09-25T22:15:00Z");
      setNow(() => pinned);
      mockFeature = { ...baseFeature, showMonthPicker: true };

      try {
        const { getByTestId } = await render(<HomeScreen />);

        expect(getByTestId("month-picker").props.minimumDate).toEqual(pinned);
      } finally {
        resetNow();
      }
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

    it("scrolls to the very top when the Home tab is pressed", async () => {
      const scrollTo = spyOnScrollTo();
      await render(<HomeScreen />);

      mockTabPressListener?.();

      expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
    });
  });
});
