import type { PlannedNotification } from "@/domain/notificationPlanner";
import * as Notifications from "expo-notifications";

import { schedule } from "./notificationGateway";

// An in-memory stand-in for Expo's scheduler: it keeps what is scheduled and
// hands out identifiers the way Expo does, so the gateway is tested against
// what it would actually get back.
jest.mock("expo-notifications", () => {
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
});

const planned = (overrides: Partial<PlannedNotification> = {}) => ({
  key: "saint:2099-01-02",
  kind: "saint" as const,
  title: "Saint of the Day",
  body: "St Paul",
  fireAt: new Date("2099-01-01T21:00:00.000Z"),
  ...overrides,
});

beforeEach(() => {
  (Notifications as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
});

describe("notificationGateway", () => {
  describe("schedule", () => {
    it("schedules at fireAt and returns the identifier Expo gave it", async () => {
      const identifier = await schedule(planned());

      expect(identifier).toBe("expo-1");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "Saint of the Day",
            body: "St Paul",
          }),
          trigger: {
            type: "date",
            date: new Date("2099-01-01T21:00:00.000Z"),
          },
        }),
      );
    });

    it("stores key, kind and fireAt in the notification's data", async () => {
      await schedule(planned());

      const request = (Notifications.scheduleNotificationAsync as jest.Mock)
        .mock.calls[0][0];
      expect(request.content.data).toEqual({
        key: "saint:2099-01-02",
        kind: "saint",
        fireAt: "2099-01-01T21:00:00.000Z",
      });
    });
  });
});
