import { act } from "react";
import { AppState, type AppStateStatus } from "react-native";

// Takes over React Native's AppState and Date.now so a test can drive the app
// between foreground and background and decide what time it is. Call it from
// a `beforeEach` and undo it with `jest.restoreAllMocks()` in an `afterEach`.
// Time starts at 0 and only moves when the test says so.
export const installFakeAppState = () => {
  let listeners: ((state: AppStateStatus) => void)[] = [];
  let now = 0;
  const removeSubscription = jest.fn();

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

  const change = async (state: AppStateStatus) => {
    await act(async () => {
      listeners.forEach((listener) => listener(state));
    });
  };

  return {
    removeSubscription,
    setNow: (ms: number) => {
      now = ms;
    },
    change,
    // Sends the app to the background and brings it back at `ms`. Awaiting it
    // lets anything the foreground refresh kicks off settle inside act().
    returnToForegroundAt: async (ms: number) => {
      await change("background");
      now = ms;
      await change("active");
    },
  };
};
