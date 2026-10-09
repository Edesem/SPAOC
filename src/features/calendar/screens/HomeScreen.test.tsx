import { resetNow, setNow } from "@/lib/parishTime";
import { stackScreenOptions } from "@/testing/expoRouterStack";
import { fontFamily, typography } from "@/theme/typography";
import HomeScreen from "./HomeScreen";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { SectionList, StyleSheet } from "react-native";

// The screen is tested against a fake useHomeFeature. What the feature
// returns is covered by useHomeFeature.test.ts and homeRules.test.ts.

const mockSetShowMonthPicker = jest.fn();
const mockOnValueChange = jest.fn();
const mockClearMonthFilter = jest.fn();
const mockOnRefresh = jest.fn();

const baseFeature = {
  todaysSaints: ["St. Test", "St. Other"],
  todaysSaintsTitle: "Today we Commemorate",
  fastLoading: false,
  loadErrorMessage: null as string | null,
  majorFastLabel: "Great Lent",
  minorFastLabel: "Fast free day",
  sections: [] as any[],
  refreshing: false,
  onRefresh: mockOnRefresh,
  selectedDate: new Date("2026-03-15T12:00:00.000Z"),
  isMonthFiltered: false,
  monthFilterLabel: null as string | null,
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
  ...require("@/testing/expoRouterStack").createStackMock(),
  router: { push: jest.fn() },
  useNavigation: () => ({
    getParent: () => ({
      addListener: (_event: string, listener: () => void) => {
        mockTabPressListener = listener;
        return () => {
          mockTabPressListener = undefined;
        };
      },
    }),
  }),
}));

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

    expect(getByText("Today we Commemorate")).toBeTruthy();
    expect(getByText("St. Test\nSt. Other")).toBeTruthy();
    expect(getByText("Great Lent")).toBeTruthy();
    expect(getByText("Fast free day")).toBeTruthy();
  });

  it("sets the commemoration heading small, in Alegreya SC and parish red", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }])],
    };

    const { getByText } = await render(<HomeScreen />);

    expect(getByText("Today we Commemorate")).toHaveStyle({
      fontFamily: fontFamily.smallCaps,
      fontSize: typography.eyebrow.fontSize,
      color: "#A3352B",
    });
  });

  it("sets the saint names larger than the commemoration heading", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }])],
    };

    const { getByText } = await render(<HomeScreen />);

    const heading = StyleSheet.flatten(
      getByText("Today we Commemorate").props.style,
    );
    const names = StyleSheet.flatten(
      getByText("St. Test\nSt. Other").props.style,
    );
    expect(names).toMatchObject({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
    expect(names.fontSize).toBeGreaterThan(heading.fontSize as number);
  });

  it("sets the fasting headings in the serif, the liturgical voice", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }])],
    };

    const { getByText } = await render(<HomeScreen />);

    expect(getByText("Great Lent")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
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
    expect(getByText("Today we Commemorate")).toBeTruthy();
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
    expect(getByText("Today we Commemorate")).toBeTruthy();
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

    it("has no month in the header while no month is selected", async () => {
      await render(<HomeScreen />);

      expect(stackScreenOptions.current.title).toBe("");
    });

    it("shows a plain calendar button, not the menu, while no month is selected", async () => {
      const { queryByTestId } = await render(<HomeScreen />);

      expect(queryByTestId("toolbar-menu")).toBeNull();
    });

    it("shows the picked month in the header and turns the calendar into a menu", async () => {
      mockFeature = {
        ...baseFeature,
        isMonthFiltered: true,
        monthFilterLabel: "March 2026",
      };

      const { getByLabelText, queryByLabelText, getByText } = await render(
        <HomeScreen />,
      );

      expect(stackScreenOptions.current.title).toBe("March 2026");
      expect(getByLabelText("Month filter, March 2026")).toBeTruthy();
      expect(getByText("Change Month")).toBeTruthy();
      expect(getByText("Show All Months")).toBeTruthy();
      expect(queryByLabelText("Choose month")).toBeNull();
    });

    it("keeps the empty message and the menu when the month has no events", async () => {
      mockFeature = {
        ...baseFeature,
        isMonthFiltered: true,
        monthFilterLabel: "March 2026",
      };

      const { getByText, getByLabelText } = await render(<HomeScreen />);

      expect(getByText("No events found.")).toBeTruthy();
      expect(getByLabelText("Month filter, March 2026")).toBeTruthy();
    });

    it("opens the month picker from the menu's Change Month", async () => {
      mockFeature = {
        ...baseFeature,
        isMonthFiltered: true,
        monthFilterLabel: "March 2026",
      };
      const { getByText } = await render(<HomeScreen />);

      await fireEvent.press(getByText("Change Month"));

      expect(mockSetShowMonthPicker).toHaveBeenCalledWith(true);
    });

    it("clears the month filter from the menu's Show All Months", async () => {
      mockFeature = {
        ...baseFeature,
        isMonthFiltered: true,
        monthFilterLabel: "March 2026",
      };
      const { getByText } = await render(<HomeScreen />);

      await fireEvent.press(getByText("Show All Months"));

      expect(mockClearMonthFilter).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  describe("settings button", () => {
    it("opens settings from the header's left button", async () => {
      const { getByLabelText } = await render(<HomeScreen />);

      await fireEvent.press(getByLabelText("Settings"));

      expect(router.push).toHaveBeenCalledWith("/settings");
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });

  describe("loading", () => {
    it("keeps the header buttons but shows a spinner instead of the list", async () => {
      mockFeature = { ...baseFeature, fastLoading: true };

      const { getByLabelText, queryByTestId } = await render(<HomeScreen />);

      expect(getByLabelText("Settings")).toBeTruthy();
      expect(queryByTestId("home-list")).toBeNull();
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

    it("scrolls back to where the list first rested, below the glass header", async () => {
      const scrollTo = spyOnScrollTo();
      const { getByTestId } = await render(<HomeScreen />);

      await fireEvent.scroll(getByTestId("home-list"), {
        nativeEvent: { contentOffset: { y: -103 } },
      });
      await fireEvent.scroll(getByTestId("home-list"), {
        nativeEvent: { contentOffset: { y: 480 } },
      });
      mockTabPressListener?.();

      expect(scrollTo).toHaveBeenCalledWith({ y: -103, animated: true });
    });
  });
});
