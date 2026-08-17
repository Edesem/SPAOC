import { useFastDay } from "@/hooks/useFastDay";
import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("@/utils/dateUtils", () => ({
  getCurrentDate: jest.fn(() => new Date("2026-08-13T10:00:00.000Z")),
}));

const mockFetch = (items: unknown[] = []) => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items }),
  });
};

const mockEvent = (
  summary: string | undefined,
  start: string,
  end: string,
) => ({
  id: "1",
  summary,
  start: { dateTime: start },
  end: { dateTime: end },
});

const renderFastDay = async () => {
  const { result } = await renderHook(() => useFastDay());

  await waitFor(() => {
    expect(result.current.fastLoading).toBe(false);
  });

  return result;
};

describe("useFastDay", () => {
  it("identifies a fast day", async () => {
    mockFetch([
      mockEvent(
        "Strict Fast",
        "2026-08-13T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z",
      ),
    ]);

    const result = await renderFastDay();

    expect(result.current.events).toEqual(["Strict Fast"]);
  });

  it("ignores non-fast events", async () => {
    mockFetch([
      mockEvent(
        "Church Service",
        "2026-08-13T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z",
      ),
    ]);

    const result = await renderFastDay();

    expect(result.current.events).toEqual([]);
  });

  it("handles events without titles", async () => {
    mockFetch([
      mockEvent(
        undefined,
        "2026-08-13T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z",
      ),
    ]);

    const result = await renderFastDay();

    expect(result.current.events).toEqual([]);
  });

  it("handles any capitalisation", async () => {
    mockFetch([
      mockEvent(
        "strict FAST",
        "2026-08-13T00:00:00.000Z",
        "2026-08-14T00:00:00.000Z",
      ),
    ]);

    const result = await renderFastDay();

    expect(result.current.events).toEqual(["Strict Fast"]);
  });

  it("ignores a past fast", async () => {
    mockFetch([
      mockEvent(
        "Strict Fast",
        "2026-08-12T00:00:00.000Z",
        "2026-08-13T00:00:00.000Z",
      ),
    ]);

    const result = await renderFastDay();

    expect(result.current.events).toEqual([]);
  });

  it("ignores a future fast", async () => {
    mockFetch([
      mockEvent(
        "Strict Fast",
        "2026-08-14T00:00:00.000Z",
        "2026-08-15T00:00:00.000Z",
      ),
    ]);

    const result = await renderFastDay();

    expect(result.current.events).toEqual([]);
  });

  it("handles an API error", async () => {
    const consoleErrorSpy = jest

      .spyOn(console, "error")

      .mockImplementation(() => {});

    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

    const result = await renderFastDay();

    expect(result.current.events).toEqual([]);

    consoleErrorSpy.mockRestore();
  });
});
