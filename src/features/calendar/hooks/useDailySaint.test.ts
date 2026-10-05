import { resetNow, setNow } from "@/lib/parishTime";
import { useDailySaint } from "./useDailySaint";
import { renderHook, waitFor } from "@testing-library/react-native";

const mockGetSaintsForDate = jest.fn();

jest.mock("../services", () => ({
  calendarService: {
    getSaintsForDate: (date: Date) => mockGetSaintsForDate(date),
  },
}));

describe("useDailySaint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSaintsForDate.mockResolvedValue(["St. Test"]);
  });

  afterEach(resetNow);

  it("asks for the saints of the day on the app clock", async () => {
    const pinned = new Date("2026-09-25T22:15:00Z");
    setNow(() => pinned);

    const { result } = await renderHook(() => useDailySaint());
    await waitFor(() =>
      expect(result.current.todaysSaints).toEqual(["St. Test"]),
    );

    expect(mockGetSaintsForDate).toHaveBeenCalledWith(pinned);
    expect(result.current.error).toBeNull();
  });

  it("reports an error when there are no saints today", async () => {
    mockGetSaintsForDate.mockResolvedValue([]);

    const { result } = await renderHook(() => useDailySaint());
    await waitFor(() =>
      expect(result.current.error).toBe("No saints found for today."),
    );

    expect(result.current.todaysSaints).toEqual([]);
  });
});
