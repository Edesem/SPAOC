import type { LiturgicalData } from "@/domain/liturgical";
import { usePrayerFeature } from "@/hooks/usePrayerFeature";
import { act, renderHook, waitFor } from "@testing-library/react-native";

const mockGetLiturgicalData = jest.fn();

jest.mock("@/services/liturgical", () => ({
  liturgicalService: {
    getLiturgicalData: (date?: Date) => mockGetLiturgicalData(date),
  },
}));

const dataFor = (feastTitle: string): LiturgicalData => ({
  day: { feastTitle, readings: [] },
  services: [{ title: "Great Vespers", pdfUrl: "https://example.com/v.pdf" }],
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("usePrayerFeature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLiturgicalData.mockResolvedValue(dataFor("Today"));
  });

  it("starts loading and then exposes today's data", async () => {
    const pending = deferred<LiturgicalData>();
    mockGetLiturgicalData.mockReturnValue(pending.promise);

    const { result } = await renderHook(() => usePrayerFeature());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await act(async () => {
      pending.resolve(dataFor("Today"));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(dataFor("Today"));
    expect(result.current.error).toBeNull();
    expect(mockGetLiturgicalData).toHaveBeenCalledTimes(1);
  });

  it("exposes the error and no data when the load fails", async () => {
    const failure = new Error("offline");
    mockGetLiturgicalData.mockRejectedValue(failure);

    const { result } = await renderHook(() => usePrayerFeature());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeNull();
  });

  it("treats a day with no services as empty, not as an error", async () => {
    mockGetLiturgicalData.mockResolvedValue({
      day: { feastTitle: "Quiet day", readings: [] },
      services: [],
    });

    const { result } = await renderHook(() => usePrayerFeature());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data?.services).toEqual([]);
  });

  it("loads the chosen date and makes it the selected date", async () => {
    const { result } = await renderHook(() => usePrayerFeature());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const picked = new Date(2026, 3, 12);
    mockGetLiturgicalData.mockResolvedValue(dataFor("Pascha"));

    await act(async () => {
      await result.current.load(picked);
    });

    expect(mockGetLiturgicalData).toHaveBeenLastCalledWith(picked);
    expect(result.current.selectedDate).toBe(picked);
    expect(result.current.data).toEqual(dataFor("Pascha"));
    expect(result.current.loading).toBe(false);
  });

  it("clears the previous day while a new date is loading", async () => {
    const { result } = await renderHook(() => usePrayerFeature());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const pending = deferred<LiturgicalData>();
    mockGetLiturgicalData.mockReturnValue(pending.promise);

    let loading!: Promise<void>;
    await act(async () => {
      loading = result.current.load(new Date(2026, 3, 12));
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await act(async () => {
      pending.resolve(dataFor("Pascha"));
      await loading;
    });
  });

  it("clears an earlier error when a later load succeeds", async () => {
    mockGetLiturgicalData.mockRejectedValueOnce(new Error("offline"));
    const { result } = await renderHook(() => usePrayerFeature());
    await waitFor(() => expect(result.current.error).not.toBeNull());

    await act(async () => {
      await result.current.load(new Date(2026, 3, 12));
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(dataFor("Today"));
  });

  it("ignores a slow response for a date that is no longer selected", async () => {
    const { result } = await renderHook(() => usePrayerFeature());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const slow = deferred<LiturgicalData>();
    const fast = deferred<LiturgicalData>();
    mockGetLiturgicalData
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);

    const second = new Date(2026, 3, 13);
    let first!: Promise<void>;
    let latest!: Promise<void>;
    await act(async () => {
      first = result.current.load(new Date(2026, 3, 12));
      latest = result.current.load(second);
    });

    await act(async () => {
      fast.resolve(dataFor("Second pick"));
      await latest;
      slow.resolve(dataFor("First pick"));
      await first;
    });

    expect(result.current.data).toEqual(dataFor("Second pick"));
    expect(result.current.selectedDate).toBe(second);
    expect(result.current.loading).toBe(false);
  });

  it("ignores a slow failure for a date that is no longer selected", async () => {
    const { result } = await renderHook(() => usePrayerFeature());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const slow = deferred<LiturgicalData>();
    mockGetLiturgicalData
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce(dataFor("Second pick"));

    let first!: Promise<void>;
    let latest!: Promise<void>;
    await act(async () => {
      first = result.current.load(new Date(2026, 3, 12));
      latest = result.current.load(new Date(2026, 3, 13));
    });

    await act(async () => {
      await latest;
      slow.reject(new Error("too late"));
      await first;
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(dataFor("Second pick"));
  });

  describe("refresh", () => {
    it("reloads the selected date rather than jumping back to today", async () => {
      const { result } = await renderHook(() => usePrayerFeature());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const picked = new Date(2026, 3, 12);
      await act(async () => {
        await result.current.load(picked);
      });

      mockGetLiturgicalData.mockResolvedValue(dataFor("Pascha, updated"));
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockGetLiturgicalData).toHaveBeenLastCalledWith(picked);
      expect(result.current.selectedDate).toBe(picked);
      expect(result.current.data).toEqual(dataFor("Pascha, updated"));
    });

    it("reports refreshing without showing the loading state", async () => {
      const { result } = await renderHook(() => usePrayerFeature());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const pending = deferred<LiturgicalData>();
      mockGetLiturgicalData.mockReturnValue(pending.promise);

      let refreshing!: Promise<void>;
      await act(async () => {
        refreshing = result.current.refresh();
      });

      expect(result.current.refreshing).toBe(true);
      expect(result.current.loading).toBe(false);

      await act(async () => {
        pending.resolve(dataFor("Today"));
        await refreshing;
      });

      expect(result.current.refreshing).toBe(false);
    });

    it("clears an earlier error when the refresh succeeds", async () => {
      mockGetLiturgicalData.mockRejectedValueOnce(new Error("offline"));
      const { result } = await renderHook(() => usePrayerFeature());
      await waitFor(() => expect(result.current.error).not.toBeNull());

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(dataFor("Today"));
    });

    it("exposes the error and stops refreshing when the refresh fails", async () => {
      const { result } = await renderHook(() => usePrayerFeature());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const failure = new Error("offline");
      mockGetLiturgicalData.mockRejectedValue(failure);
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBe(failure);
      expect(result.current.data).toBeNull();
      expect(result.current.refreshing).toBe(false);
    });

    it("stops refreshing even when a newer pick supersedes it", async () => {
      const { result } = await renderHook(() => usePrayerFeature());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const slowRefresh = deferred<LiturgicalData>();
      mockGetLiturgicalData
        .mockReturnValueOnce(slowRefresh.promise)
        .mockResolvedValueOnce(dataFor("Picked"));

      let refreshing!: Promise<void>;
      let picking!: Promise<void>;
      await act(async () => {
        refreshing = result.current.refresh();
        picking = result.current.load(new Date(2026, 3, 12));
      });

      await act(async () => {
        await picking;
        slowRefresh.resolve(dataFor("Stale refresh"));
        await refreshing;
      });

      expect(result.current.data).toEqual(dataFor("Picked"));
      expect(result.current.refreshing).toBe(false);
    });
  });
});
