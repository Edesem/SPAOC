import { resetNow, setNow } from "@/lib/parishTime";
import { useDailySaint } from "./useDailySaint";
import { act, renderHook, waitFor } from "@testing-library/react-native";

const mockGetSaintsForDate = jest.fn();

jest.mock("../services", () => ({
  calendarService: {
    getSaintsForDateOrThrow: (date: Date) => mockGetSaintsForDate(date),
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

  it("shows no saints and no error on a day without saints", async () => {
    mockGetSaintsForDate.mockResolvedValue([]);

    const { result } = await renderHook(() => useDailySaint());
    await waitFor(() => expect(mockGetSaintsForDate).toHaveBeenCalled());

    expect(result.current.todaysSaints).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("reports an error when the saints request fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetSaintsForDate.mockRejectedValue(new Error("Network error"));

    const { result } = await renderHook(() => useDailySaint());
    await waitFor(() =>
      expect(result.current.error).toBe("Could not load today's saints."),
    );

    expect(result.current.todaysSaints).toEqual([]);
    consoleErrorSpy.mockRestore();
  });

  it("clears the error once a refetch succeeds", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetSaintsForDate.mockRejectedValueOnce(new Error("Network error"));
    const { result } = await renderHook(() => useDailySaint());
    await waitFor(() => expect(result.current.error).not.toBeNull());

    mockGetSaintsForDate.mockResolvedValue(["St. Test"]);
    await act(async () => {
      await result.current.refetchSaints();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.todaysSaints).toEqual(["St. Test"]);
    consoleErrorSpy.mockRestore();
  });
});
