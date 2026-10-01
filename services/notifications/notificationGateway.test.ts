import type { PlannedNotification } from "@/domain/notificationPlanner";
import * as Notifications from "expo-notifications";

import { cancel, listScheduled, schedule } from "./notificationGateway";

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

  describe("listScheduled", () => {
    it("returns scheduled notifications with the key, kind and fireAt they were scheduled with", async () => {
      const identifier = await schedule(planned());

      expect(await listScheduled()).toEqual([
        {
          identifier,
          key: "saint:2099-01-02",
          kind: "saint",
          title: "Saint of the Day",
          body: "St Paul",
          fireAt: new Date("2099-01-01T21:00:00.000Z"),
        },
      ]);
    });

    it("returns nothing when nothing is scheduled", async () => {
      expect(await listScheduled()).toEqual([]);
    });

    it("returns a notification scheduled before keys existed with no key or fireAt", async () => {
      await Notifications.scheduleNotificationAsync({
        content: { title: "Something else", body: "Old", data: {} },
        trigger: null,
      });

      expect(await listScheduled()).toEqual([
        expect.objectContaining({
          key: null,
          kind: null,
          title: "Something else",
          fireAt: null,
        }),
      ]);
    });

    it("recognises an old Saint of the Day notification by its title", async () => {
      await Notifications.scheduleNotificationAsync({
        content: { title: "Saint of the Day", body: "St Paul" },
        trigger: null,
      });

      expect(await listScheduled()).toEqual([
        expect.objectContaining({ key: null, kind: "saint", fireAt: null }),
      ]);
    });

    it("treats data it cannot read as unkeyed rather than failing", async () => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Odd",
          body: "",
          data: { key: 42, kind: "bogus", fireAt: "not a date" },
        },
        trigger: null,
      });

      expect(await listScheduled()).toEqual([
        expect.objectContaining({ key: null, kind: null, fireAt: null }),
      ]);
    });
  });

  describe("cancel", () => {
    it("cancels only the given identifiers", async () => {
      const first = await schedule(planned());
      const second = await schedule(planned({ key: "saint:2099-01-03" }));
      const third = await schedule(planned({ key: "saint:2099-01-04" }));

      await cancel([first, third]);

      expect((await listScheduled()).map((n) => n.identifier)).toEqual([
        second,
      ]);
    });

    it("does nothing for an empty list", async () => {
      await schedule(planned());

      await cancel([]);

      expect(await listScheduled()).toHaveLength(1);
      expect(
        Notifications.cancelScheduledNotificationAsync,
      ).not.toHaveBeenCalled();
    });
  });
});
