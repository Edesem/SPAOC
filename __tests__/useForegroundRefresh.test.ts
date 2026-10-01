import { useForegroundRefresh } from "@/hooks/useForegroundRefresh";
import { renderHook } from "@testing-library/react-native";
import { act } from "react";
import { AppState, type AppStateStatus } from "react-native";

const THRESHOLD_MS = 1000;

let listeners: ((state: AppStateStatus) => void)[];
let removeSubscription: jest.Mock;
let now: number;

const changeAppState = (state: AppStateStatus) => {
  act(() => {
    listeners.forEach((listener) => listener(state));
  });
};

// Sends the app to the background and back at `at` (ms since the test began).
const returnToForegroundAt = (at: number) => {
  changeAppState("background");
  now = at;
  changeAppState("active");
};

describe("useForegroundRefresh", () => {
  beforeEach(() => {
    listeners = [];
    removeSubscription = jest.fn();
    now = 0;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, listener) => {
        listeners.push(listener);
        return {
          remove: () => {
            removeSubscription();
            listeners = listeners.filter((l) => l !== listener);
          },
        };
      });
    AppState.currentState = "active";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not refresh the first time the app returns to the foreground", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));

    returnToForegroundAt(THRESHOLD_MS * 10);

    expect(callback).not.toHaveBeenCalled();
  });

  it("refreshes when the app returns after the threshold has passed", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    returnToForegroundAt(0);

    returnToForegroundAt(THRESHOLD_MS + 1);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the app returns within the threshold", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    returnToForegroundAt(0);

    returnToForegroundAt(THRESHOLD_MS);

    expect(callback).not.toHaveBeenCalled();
  });

  it("measures the next threshold from the last refresh", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    returnToForegroundAt(0);
    returnToForegroundAt(THRESHOLD_MS + 1);

    returnToForegroundAt(THRESHOLD_MS + 2);
    expect(callback).toHaveBeenCalledTimes(1);

    returnToForegroundAt(THRESHOLD_MS * 2 + 2);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("only refreshes on a return to active, not when the app leaves", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    returnToForegroundAt(0);

    now = THRESHOLD_MS * 10;
    changeAppState("inactive");
    changeAppState("background");

    expect(callback).not.toHaveBeenCalled();
  });

  it("treats a return from inactive as a return to the foreground", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    returnToForegroundAt(0);

    changeAppState("inactive");
    now = THRESHOLD_MS + 1;
    changeAppState("active");

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("calls the latest callback after a re-render", async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = await renderHook(
      ({ callback }) => useForegroundRefresh(THRESHOLD_MS, callback),
      { initialProps: { callback: first } },
    );
    returnToForegroundAt(0);

    await rerender({ callback: second });
    returnToForegroundAt(THRESHOLD_MS + 1);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops listening when unmounted", async () => {
    const { unmount } = await renderHook(() =>
      useForegroundRefresh(THRESHOLD_MS, jest.fn()),
    );

    await unmount();

    expect(removeSubscription).toHaveBeenCalledTimes(1);
  });
});
