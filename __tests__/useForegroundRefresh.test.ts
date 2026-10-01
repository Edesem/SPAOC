import { useForegroundRefresh } from "@/hooks/useForegroundRefresh";
import { renderHook } from "@testing-library/react-native";
import { installFakeAppState } from "@/test-utils/fakeAppState";

const THRESHOLD_MS = 1000;

let appState: ReturnType<typeof installFakeAppState>;

describe("useForegroundRefresh", () => {
  beforeEach(() => {
    appState = installFakeAppState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not refresh the first time the app returns to the foreground", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));

    await appState.returnToForegroundAt(THRESHOLD_MS * 10);

    expect(callback).not.toHaveBeenCalled();
  });

  it("refreshes when the app returns after the threshold has passed", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    await appState.returnToForegroundAt(0);

    await appState.returnToForegroundAt(THRESHOLD_MS + 1);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the app returns within the threshold", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    await appState.returnToForegroundAt(0);

    await appState.returnToForegroundAt(THRESHOLD_MS);

    expect(callback).not.toHaveBeenCalled();
  });

  it("measures the next threshold from the last refresh", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    await appState.returnToForegroundAt(0);
    await appState.returnToForegroundAt(THRESHOLD_MS + 1);

    await appState.returnToForegroundAt(THRESHOLD_MS + 2);
    expect(callback).toHaveBeenCalledTimes(1);

    await appState.returnToForegroundAt(THRESHOLD_MS * 2 + 2);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("only refreshes on a return to active, not when the app leaves", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    await appState.returnToForegroundAt(0);

    appState.setNow(THRESHOLD_MS * 10);
    await appState.change("inactive");
    await appState.change("background");

    expect(callback).not.toHaveBeenCalled();
  });

  it("treats a return from inactive as a return to the foreground", async () => {
    const callback = jest.fn();
    await renderHook(() => useForegroundRefresh(THRESHOLD_MS, callback));
    await appState.returnToForegroundAt(0);

    await appState.change("inactive");
    appState.setNow(THRESHOLD_MS + 1);
    await appState.change("active");

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("calls the latest callback after a re-render", async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = await renderHook(
      ({ callback }) => useForegroundRefresh(THRESHOLD_MS, callback),
      { initialProps: { callback: first } },
    );
    await appState.returnToForegroundAt(0);

    await rerender({ callback: second });
    await appState.returnToForegroundAt(THRESHOLD_MS + 1);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops listening when unmounted", async () => {
    const { unmount } = await renderHook(() =>
      useForegroundRefresh(THRESHOLD_MS, jest.fn()),
    );

    await unmount();

    expect(appState.removeSubscription).toHaveBeenCalledTimes(1);
  });
});
