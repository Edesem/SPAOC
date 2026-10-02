import { useEffect, useRef } from "react";
import { AppState } from "react-native";

// Calls `callback` when the app returns to the foreground and more than
// `thresholdMs` has passed since the last refresh. The first return to the
// foreground only starts the clock; it never refreshes.
export const useForegroundRefresh = (
  thresholdMs: number,
  callback: () => void,
) => {
  const appState = useRef(AppState.currentState);
  const lastRefreshTime = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        const now = Date.now();
        if (lastRefreshTime.current === null) {
          lastRefreshTime.current = now;
        }

        if (now - lastRefreshTime.current > thresholdMs) {
          callback();
          lastRefreshTime.current = now;
        }
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [thresholdMs, callback]);
};
