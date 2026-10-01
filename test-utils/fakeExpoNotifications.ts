// An in-memory stand-in for expo-notifications' scheduler: it keeps what is
// scheduled and hands out identifiers the way Expo does, so code is tested
// against what it would actually get back. Use it from a test with:
//
//   jest.mock("expo-notifications", () =>
//     require("@/test-utils/fakeExpoNotifications").createFakeExpoNotifications(),
//   );
export const createFakeExpoNotifications = () => {
  const store = new Map<string, unknown>();
  let counter = 0;

  return {
    SchedulableTriggerInputTypes: { DATE: "date" },
    scheduleNotificationAsync: jest.fn(async (request: unknown) => {
      const identifier = `expo-${++counter}`;
      store.set(identifier, { identifier, ...(request as object) });
      return identifier;
    }),
    getAllScheduledNotificationsAsync: jest.fn(async () => [...store.values()]),
    cancelScheduledNotificationAsync: jest.fn(async (identifier: string) => {
      store.delete(identifier);
    }),
    __reset: () => {
      store.clear();
      counter = 0;
    },
  };
};
