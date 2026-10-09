import { stackScreenOptions } from "@/testing/expoRouterStack";
import { fontFamily, typography } from "@/theme/typography";
import HomeScreen from "./HomeScreen";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { SectionList, StyleSheet, processColor } from "react-native";

// The screen is tested against a fake useHomeFeature. What the feature
// returns is covered by useHomeFeature.test.ts and homeRules.test.ts.

const mockSelectMonth = jest.fn();
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
  isMonthFiltered: false,
  monthFilterLabel: null as string | null,
  clearMonthFilter: mockClearMonthFilter,
  monthOptions: [] as {
    label: string;
    date: Date;
    isSelected: boolean;
  }[],
  selectMonth: mockSelectMonth,
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

  it("sets the week label in the regular italic serif and the day headers in the sans", async () => {
    mockFeature = {
      ...baseFeature,
      sections: [eventSection("Today", 0, [{ id: "1" }], "This week")],
    };

    const { getByText } = await render(<HomeScreen />);

    expect(getByText("This week")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontSize: 25,
      fontWeight: "400",
      fontStyle: "italic",
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

  describe("week dividers", () => {
    const HIDDEN = { includeHiddenElements: true };

    it("closes the header with a bronze divider even when there are no events", async () => {
      const { getAllByTestId } = await render(<HomeScreen />);

      const marks = getAllByTestId("ornamental-divider-mark", HIDDEN);
      expect(marks).toHaveLength(1);
      expect(marks[0].props.fill.payload).toBe(processColor("#a88646"));
    });

    it("adds a divider above each later week label but not the first", async () => {
      mockFeature = {
        ...baseFeature,
        sections: [
          eventSection("Today", 0, [{ id: "1" }], "This Week"),
          eventSection("Tomorrow", 1, [{ id: "2" }]),
          eventSection("Monday", 2, [{ id: "3" }], "Next Week"),
          eventSection("Sunday", 3, [{ id: "4" }], "Week of 24 August"),
        ],
      };

      const { getAllByTestId } = await render(<HomeScreen />);

      // Header, "Next Week" and "Week of 24 August".
      expect(getAllByTestId("ornamental-divider", HIDDEN)).toHaveLength(3);
    });

    it("adds no divider for a first section that has a week label", async () => {
      mockFeature = {
        ...baseFeature,
        sections: [eventSection("Today", 0, [{ id: "1" }], "This Week")],
      };

      const { getAllByTestId } = await render(<HomeScreen />);

      expect(getAllByTestId("ornamental-divider", HIDDEN)).toHaveLength(1);
    });
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
    const march = {
      label: "March 2026",
      date: new Date("2026-03-10T12:00:00.000Z"),
      isSelected: false,
    };
    const april = {
      label: "April 2026",
      date: new Date("2026-04-10T12:00:00.000Z"),
      isSelected: false,
    };

    it("always offers the calendar as a menu, even when nothing has loaded", async () => {
      const { getByTestId, getByLabelText, getByText } = await render(
        <HomeScreen />,
      );

      expect(getByTestId("toolbar-menu")).toBeTruthy();
      expect(getByLabelText("Choose month")).toBeTruthy();
      expect(getByText("All Months")).toBeTruthy();
    });

    it("lists a menu item for each month option", async () => {
      mockFeature = { ...baseFeature, monthOptions: [march, april] };

      const { getByText } = await render(<HomeScreen />);

      expect(getByText("March 2026")).toBeTruthy();
      expect(getByText("April 2026")).toBeTruthy();
    });

    it("ticks All Months while no month is selected", async () => {
      mockFeature = { ...baseFeature, monthOptions: [march] };

      const { getByRole, queryByRole } = await render(<HomeScreen />);

      expect(
        getByRole("menuitem", { name: "All Months", selected: true }),
      ).toBeTruthy();
      expect(
        queryByRole("menuitem", { name: "March 2026", selected: true }),
      ).toBeNull();
    });

    it("ticks the selected month instead of All Months", async () => {
      mockFeature = {
        ...baseFeature,
        isMonthFiltered: true,
        monthFilterLabel: "March 2026",
        monthOptions: [{ ...march, isSelected: true }, april],
      };

      const { getByRole, queryByRole } = await render(<HomeScreen />);

      expect(
        getByRole("menuitem", { name: "March 2026", selected: true }),
      ).toBeTruthy();
      expect(
        queryByRole("menuitem", { name: "April 2026", selected: true }),
      ).toBeNull();
      expect(
        queryByRole("menuitem", { name: "All Months", selected: true }),
      ).toBeNull();
    });

    it("filters to a month when its menu item is pressed", async () => {
      mockFeature = { ...baseFeature, monthOptions: [march, april] };
      const { getByText } = await render(<HomeScreen />);

      await fireEvent.press(getByText("April 2026"));

      expect(mockSelectMonth).toHaveBeenCalledWith(april.date);
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it("clears the month filter from All Months", async () => {
      mockFeature = {
        ...baseFeature,
        isMonthFiltered: true,
        monthFilterLabel: "March 2026",
        monthOptions: [{ ...march, isSelected: true }],
      };
      const { getByText } = await render(<HomeScreen />);

      await fireEvent.press(getByText("All Months"));

      expect(mockClearMonthFilter).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });

    it("has no month in the header while no month is selected", async () => {
      await render(<HomeScreen />);

      expect(stackScreenOptions.current.title).toBe("");
    });

    it("shows the picked month in the header and on the menu's label", async () => {
      mockFeature = {
        ...baseFeature,
        isMonthFiltered: true,
        monthFilterLabel: "March 2026",
        monthOptions: [{ ...march, isSelected: true }],
      };

      const { getByLabelText, queryByLabelText } = await render(<HomeScreen />);

      expect(stackScreenOptions.current.title).toBe("March 2026");
      expect(getByLabelText("Month filter, March 2026")).toBeTruthy();
      expect(queryByLabelText("Choose month")).toBeNull();
    });

    it("keeps the empty message and the menu when the month has no events", async () => {
      mockFeature = {
        ...baseFeature,
        isMonthFiltered: true,
        monthFilterLabel: "March 2026",
        monthOptions: [{ ...march, isSelected: true }],
      };

      const { getByText, getByLabelText } = await render(<HomeScreen />);

      expect(getByText("No events found.")).toBeTruthy();
      expect(getByLabelText("Month filter, March 2026")).toBeTruthy();
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
