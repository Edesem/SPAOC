import { useHomeFeature } from "@/hooks/useHomeFeature";
import { act, renderHook } from "@testing-library/react-native";

const mockRefetchSaints = jest.fn();
const mockRefetchEvents = jest.fn();
const mockRefetchFast = jest.fn();
const mockRequestNotificationPermissions = jest.fn();
const mockSetupNotificationListeners = jest.fn();
const mockScheduleSaintNotificationsForNext7Days = jest.fn();

let mockDailySaintState = {
  todaysSaints: ["St. Test"],
  refetchSaints: mockRefetchSaints,
};
let mockEventsState: { groupedEvents: any[]; refetch: jest.Mock } = {
  groupedEvents: [],
  refetch: mockRefetchEvents,
};
let mockFastDayState: { events: string[]; fastLoading: boolean; refetch: jest.Mock } = {
  events: [],
  fastLoading: false,
  refetch: mockRefetchFast,
};

jest.mock("@/hooks/useDailySaint", () => ({
  useDailySaint: () => mockDailySaintState,
}));

jest.mock("@/hooks/useEvents", () => ({
  useEvents: () => mockEventsState,
}));

jest.mock("@/hooks/useFastDay", () => ({
  useFastDay: () => mockFastDayState,
}));

jest.mock("@/notifications", () => ({
  requestNotificationPermissions: () => mockRequestNotificationPermissions(),
  setupNotificationListeners: () => mockSetupNotificationListeners(),
}));

jest.mock("@/utils/notifications", () => ({
  scheduleSaintNotificationsForNext7Days: () =>
    mockScheduleSaintNotificationsForNext7Days(),
}));

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(callback, []);
    },
  };
});

describe("useHomeFeature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDailySaintState = {
      todaysSaints: ["St. Test"],
      refetchSaints: mockRefetchSaints,
    };
    mockEventsState = { groupedEvents: [], refetch: mockRefetchEvents };
    mockFastDayState = { events: [], fastLoading: false, refetch: mockRefetchFast };
  });

  it("sets up notifications and loads events on mount", async () => {
    await renderHook(() => useHomeFeature());

    expect(mockRequestNotificationPermissions).toHaveBeenCalled();
    expect(mockSetupNotificationListeners).toHaveBeenCalled();
    expect(mockScheduleSaintNotificationsForNext7Days).toHaveBeenCalled();
    expect(mockRefetchEvents).toHaveBeenCalled();
  });

  it("titles the saint section for a single saint", async () => {
    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.todaysSaintsTitle).toBe("Today's Feast:");
  });

  it("titles the saint section for multiple saints", async () => {
    mockDailySaintState = {
      todaysSaints: ["St. A", "St. B"],
      refetchSaints: mockRefetchSaints,
    };

    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.todaysSaintsTitle).toBe("Today's Feasts");
  });

  it("falls back to 'No Fast' when there are no fasting events", async () => {
    const { result } = await renderHook(() => useHomeFeature());

    expect(result.current.majorFastLabel).toBeNull();
    expect(result.current.minorFastLabel).toBe("No Fast");
  });

  it("derives the major and minor fast labels from fasting events", async () => {
    mockFastDayState = {
      events: ["Great Lent", "Strict Fast"],
      fastLoading: false,
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
    expect(mockRefetchEvents).toHaveBeenCalledTimes(2); // once on mount, once on refresh
    expect(result.current.refreshing).toBe(false);
  });

  it("filters events to the picked month and closes the picker", async () => {
    mockEventsState = {
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
      result.current.setShowMonthPicker(true);
    });

    await act(async () => {
      result.current.onValueChange(
        "dateSetAction",
        new Date("2026-03-15T12:00:00.000Z"),
      );
    });

    const eventSection = result.current.sections.find(
      (section: any) => section.sectionIndex === 0,
    ) as any;

    expect(eventSection.data).toEqual([
      { id: "1", start: "2026-03-10T12:00:00.000Z" },
    ]);
    expect(result.current.showMonthPicker).toBe(false);
  });
});
