import { FastKind } from "../domain/fasting";
import { useHomeFeature } from "./useHomeFeature";
import { installFakeAppState } from "@/test-utils/fakeAppState";
import { act, renderHook } from "@testing-library/react-native";

const mockRefetchSaints = jest.fn();
const mockRefetchEvents = jest.fn();
const mockRefetchFast = jest.fn();
const mockRequestNotificationPermissions = jest.fn();
const mockSetupNotificationListeners = jest.fn();

let mockDailySaintState: {
  todaysSaints: string[];
  error: string | null;
  refetchSaints: jest.Mock;
} = {
  todaysSaints: ["St. Test"],
  error: null,
  refetchSaints: mockRefetchSaints,
};
let mockEventsState: {
  groupedEvents: any[];
  error: string | null;
  refetch: jest.Mock;
} = {
  groupedEvents: [],
  error: null,
  refetch: mockRefetchEvents,
};
let mockFastDayState: {
  events: FastKind[];
  fastLoading: boolean;
  error: string | null;
  refetch: jest.Mock;
} = {
  events: [],
  fastLoading: false,
  error: null,
  refetch: mockRefetchFast,
};

jest.mock("./useDailySaint", () => ({
  useDailySaint: () => mockDailySaintState,
}));

jest.mock("./useEvents", () => ({
  useEvents: () => mockEventsState,
}));

jest.mock("./useFastDay", () => ({
  useFastDay: () => mockFastDayState,
}));

jest.mock("@/features/notifications", () => ({
  requestNotificationPermissions: () => mockRequestNotificationPermissions(),
  setupNotificationListeners: () => mockSetupNotificationListeners(),
}));

describe("useHomeFeature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDailySaintState = {
      todaysSaints: ["St. Test"],
      error: null,
      refetchSaints: mockRefetchSaints,
    };
    mockEventsState = {
      groupedEvents: [],
      error: null,
      refetch: mockRefetchEvents,
    };
    mockFastDayState = {
      events: [],
      fastLoading: false,
      error: null,
      refetch: mockRefetchFast,
    };
  });

  it("leaves notification setup to the root layout", async () => {
    await renderHook(() => useHomeFeature());

    expect(mockRequestNotificationPermissions).not.toHaveBeenCalled();
    expect(mockSetupNotificationListeners).not.toHaveBeenCalled();
  });

  it("does not refetch events on mount or screen focus", async () => {
    await renderHook(() => useHomeFeature());

    expect(mockRefetchEvents).not.toHaveBeenCalled();
  });

  describe("when a source fails to load", () => {
    it("has no load error message when everything loads", async () => {
      const { result } = await renderHook(() => useHomeFeature());

      expect(result.current.loadErrorMessage).toBeNull();
    });

    it("reports a failed events load", async () => {
      mockEventsState = { ...mockEventsState, error: "Could not load events." };

      const { result } = await renderHook(() => useHomeFeature());

      expect(result.current.loadErrorMessage).toBe(
        "Couldn't load events. Pull down to retry.",
      );
    });

    it("reports a failed saints load, not as a day without saints", async () => {
      mockDailySaintState = {
        ...mockDailySaintState,
        todaysSaints: [],
        error: "Could not load today's saints.",
      };

      const { result } = await renderHook(() => useHomeFeature());

      expect(result.current.loadErrorMessage).toBe(
        "Couldn't load today's feast. Pull down to retry.",
      );
    });

    it("reports a failed fast day load", async () => {
      mockFastDayState = {
        ...mockFastDayState,
        error: "Could not load the fasting calendar.",
      };

      const { result } = await renderHook(() => useHomeFeature());

      expect(result.current.loadErrorMessage).toBe(
        "Couldn't load the fast. Pull down to retry.",
      );
    });

    it("keeps showing the events that did load", async () => {
      mockEventsState = {
        groupedEvents: [
          {
            title: "Day",
            data: [{ id: "1", start: "2026-03-10T12:00:00.000Z" }],
          },
        ],
        error: null,
        refetch: mockRefetchEvents,
      };
      mockFastDayState = { ...mockFastDayState, error: "x" };

      const { result } = await renderHook(() => useHomeFeature());

      expect(result.current.sections).toHaveLength(1);
    });
  });

  it("titles the saint section for a single saint", async () => {
    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.todaysSaintsTitle).toBe("Today we Commemorate");
  });

  it("titles the saint section for multiple saints", async () => {
    mockDailySaintState = {
      todaysSaints: ["St. A", "St. B"],
      error: null,
      refetchSaints: mockRefetchSaints,
    };

    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.todaysSaintsTitle).toBe("Today we Commemorate");
  });

  it("falls back to 'No Fast' when there are no fasting events", async () => {
    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.majorFastLabel).toBeNull();
    expect(result.current.minorFastLabel).toBe("No Fast");
  });

  it("derives the major and minor fast labels from fasting events", async () => {
    mockFastDayState = {
      events: [FastKind.GreatLent, FastKind.StrictFast],
      fastLoading: false,
      error: null,
      refetch: mockRefetchFast,
    };

    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.majorFastLabel).toBe("Great Lent");
    expect(result.current.minorFastLabel).toBe(
      "Abstain from meat, fish, dairy, eggs, wine, olive oil",
    );
  });

  it("refetches saints, fast day and events together on refresh", async () => {
    const { result } = await renderHook(() => useHomeFeature());

    await act(async () => {
      await result.current.onRefresh();
    });

    expect(mockRefetchSaints).toHaveBeenCalled();
    expect(mockRefetchFast).toHaveBeenCalled();
    expect(mockRefetchEvents).toHaveBeenCalledTimes(1);
    expect(result.current.refreshing).toBe(false);
  });

  it("returns only the event sections, with no placeholder sections", async () => {
    mockEventsState = {
      groupedEvents: [
        {
          title: "Day",
          data: [{ id: "1", start: "2026-03-10T12:00:00.000Z" }],
        },
      ],
      error: null,
      refetch: mockRefetchEvents,
    };

    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.sections).toEqual([
      {
        title: "Day",
        data: [{ id: "1", start: "2026-03-10T12:00:00.000Z" }],
        sectionIndex: 0,
      },
    ]);
  });

  it("returns no sections when there are no events", async () => {
    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.sections).toEqual([]);
  });

  it("filters events to the picked month", async () => {
    mockEventsState = {
      error: null,
      groupedEvents: [
        {
          title: "Day",
          data: [
            { id: "1", start: "2026-03-10T12:00:00.000Z" },
            { id: "2", start: "2026-04-10T12:00:00.000Z" },
          ],
        },
      ],
      refetch: mockRefetchEvents,
    };

    const { result } = await renderHook(() => useHomeFeature());

    await act(async () => {
      result.current.selectMonth(new Date("2026-03-15T12:00:00.000Z"));
    });

    const eventSection = result.current.sections.find(
      (section: any) => section.sectionIndex === 0,
    ) as any;

    expect(eventSection.data).toEqual([
      { id: "1", start: "2026-03-10T12:00:00.000Z" },
    ]);
  });

  describe("month options", () => {
    const marchAndApril = () => ({
      error: null,
      groupedEvents: [
        {
          title: "Day",
          data: [
            { id: "1", start: "2026-03-10T12:00:00.000Z" },
            { id: "2", start: "2026-04-10T12:00:00.000Z" },
          ],
        },
      ],
      refetch: mockRefetchEvents,
    });

    it("offers no months before events have loaded", async () => {
      const { result } = await renderHook(() => useHomeFeature());

      expect(result.current.monthOptions).toEqual([]);
    });

    it("offers the months that have events, none ticked until one is picked", async () => {
      mockEventsState = marchAndApril();

      const { result } = await renderHook(() => useHomeFeature());

      expect(
        result.current.monthOptions.map((o) => [o.label, o.isSelected]),
      ).toEqual([
        ["March 2026", false],
        ["April 2026", false],
      ]);
    });

    it("ticks the picked month and filters to it", async () => {
      mockEventsState = marchAndApril();
      const { result } = await renderHook(() => useHomeFeature());

      await act(async () => {
        result.current.selectMonth(result.current.monthOptions[1].date);
      });

      expect(
        result.current.monthOptions.map((o) => [o.label, o.isSelected]),
      ).toEqual([
        ["March 2026", false],
        ["April 2026", true],
      ]);
      expect(result.current.monthFilterLabel).toBe("April 2026");
    });

    it("keeps a picked month listed after it has no events", async () => {
      mockEventsState = marchAndApril();
      const { result } = await renderHook(() => useHomeFeature());

      await act(async () => {
        result.current.selectMonth(new Date("2026-08-15T12:00:00.000Z"));
      });

      expect(
        result.current.monthOptions.map((o) => [o.label, o.isSelected]),
      ).toEqual([
        ["March 2026", false],
        ["April 2026", false],
        ["August 2026", true],
      ]);
    });
  });

  describe("clearing the month filter", () => {
    const marchAndApril = () => ({
      error: null,
      groupedEvents: [
        {
          title: "Day",
          data: [
            { id: "1", start: "2026-03-10T12:00:00.000Z" },
            { id: "2", start: "2026-04-10T12:00:00.000Z" },
          ],
        },
      ],
      refetch: mockRefetchEvents,
    });

    it("is not filtering by month until a month is picked", async () => {
      const { result } = await renderHook(() => useHomeFeature());

      expect(result.current.isMonthFiltered).toBe(false);
    });

    it("reports the filter as active once a month is picked", async () => {
      const { result } = await renderHook(() => useHomeFeature());

      await act(async () => {
        result.current.selectMonth(new Date("2026-03-15T12:00:00.000Z"));
      });

      expect(result.current.isMonthFiltered).toBe(true);
    });

    it("labels the filter with the picked month, and has no label without one", async () => {
      const { result } = await renderHook(() => useHomeFeature());
      expect(result.current.monthFilterLabel).toBeNull();

      await act(async () => {
        result.current.selectMonth(new Date("2026-03-15T12:00:00.000Z"));
      });
      expect(result.current.monthFilterLabel).toBe("March 2026");

      await act(async () => {
        result.current.clearMonthFilter();
      });
      expect(result.current.monthFilterLabel).toBeNull();
    });

    it("shows every event again after the filter is cleared", async () => {
      mockEventsState = marchAndApril();
      const { result } = await renderHook(() => useHomeFeature());

      await act(async () => {
        result.current.selectMonth(new Date("2026-03-15T12:00:00.000Z"));
      });
      await act(async () => {
        result.current.clearMonthFilter();
      });

      expect(result.current.isMonthFiltered).toBe(false);
      expect(result.current.sections).toHaveLength(1);
      expect((result.current.sections[0] as any).data).toHaveLength(2);
    });

    it("recovers from a month with no events", async () => {
      mockEventsState = marchAndApril();
      const { result } = await renderHook(() => useHomeFeature());

      await act(async () => {
        result.current.selectMonth(new Date("2026-08-15T12:00:00.000Z"));
      });
      expect(result.current.sections).toEqual([]);

      await act(async () => {
        result.current.clearMonthFilter();
      });

      expect(result.current.sections).toHaveLength(1);
    });
  });
});

describe("useHomeFeature foreground refresh", () => {
  // Home refreshes once the app has been open for 5 hours since it last did.
  const FIVE_HOURS_MS = 300 * 60 * 1000;
  let appState: ReturnType<typeof installFakeAppState>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDailySaintState = {
      todaysSaints: ["St. Test"],
      error: null,
      refetchSaints: mockRefetchSaints,
    };
    mockEventsState = {
      groupedEvents: [],
      error: null,
      refetch: mockRefetchEvents,
    };
    mockFastDayState = {
      events: [],
      fastLoading: false,
      error: null,
      refetch: mockRefetchFast,
    };
    appState = installFakeAppState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("refetches everything when the app returns after 5 hours", async () => {
    await renderHook(() => useHomeFeature());
    await appState.returnToForegroundAt(0);

    await appState.returnToForegroundAt(FIVE_HOURS_MS + 1);

    expect(mockRefetchSaints).toHaveBeenCalledTimes(1);
    expect(mockRefetchFast).toHaveBeenCalledTimes(1);
    expect(mockRefetchEvents).toHaveBeenCalledTimes(1);
  });

  it("does not refetch when the app returns within 5 hours", async () => {
    await renderHook(() => useHomeFeature());
    await appState.returnToForegroundAt(0);

    await appState.returnToForegroundAt(FIVE_HOURS_MS);

    expect(mockRefetchSaints).not.toHaveBeenCalled();
    expect(mockRefetchFast).not.toHaveBeenCalled();
    expect(mockRefetchEvents).not.toHaveBeenCalled();
  });
});
