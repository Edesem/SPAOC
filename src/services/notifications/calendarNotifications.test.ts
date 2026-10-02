import { atParishHour, setNow } from "@/domain/parishTime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { scheduleCategoryNotifications } from "./calendarNotifications";
import { listScheduled } from "./notificationGateway";

jest.mock("expo-notifications", () =>
  jest
    .requireActual("@/test-utils/fakeExpoNotifications")
    .createFakeExpoNotifications(),
);

const NOW = new Date("2098-12-31T18:00:00.000Z");
const EVENT_START = new Date("2099-01-20T09:00:00.000Z");

const storeEvents = (calendar: string, events: object[]) =>
  AsyncStorage.setItem(`events-${calendar}`, JSON.stringify(events));

const event = (id: string, start = EVENT_START.toISOString()) => ({
  id,
  title: `Event ${id}`,
  start,
});

beforeEach(async () => {
  await AsyncStorage.clear();
  (Notifications as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
  setNow(() => NOW);
});

afterEach(() => setNow(() => new Date()));

describe("scheduleCategoryNotifications", () => {
  it("schedules a keyed notification daysBefore the event at 9am", async () => {
    await storeEvents("youth", [event("a")]);

    await scheduleCategoryNotifications("youth", {
      enabled: true,
      daysBefore: 2,
    });

    expect(await listScheduled()).toEqual([
      expect.objectContaining({
        key: "calendar:youth:a",
        kind: "calendar",
        title: "Event a coming up!",
        fireAt: atParishHour(EVENT_START, 9, -2),
      }),
    ]);
  });

  it("does nothing when the calendar is off or has no setting", async () => {
    await storeEvents("youth", [event("a")]);

    await scheduleCategoryNotifications("youth", {
      enabled: false,
      daysBefore: 1,
    });
    await scheduleCategoryNotifications("youth", undefined);

    expect(await listScheduled()).toEqual([]);
  });

  it("does nothing when no events are stored for the calendar", async () => {
    await scheduleCategoryNotifications("youth", {
      enabled: true,
      daysBefore: 1,
    });

    expect(await listScheduled()).toEqual([]);
  });

  it("does not schedule an event twice when run again", async () => {
    await storeEvents("youth", [event("a")]);
    const setting = { enabled: true, daysBefore: 1 };

    await scheduleCategoryNotifications("youth", setting);
    await scheduleCategoryNotifications("youth", setting);

    expect(await listScheduled()).toHaveLength(1);
  });

  it("keeps two calendars' events with the same id apart", async () => {
    await storeEvents("youth", [event("a")]);
    await storeEvents("choir", [event("a")]);
    const setting = { enabled: true, daysBefore: 1 };

    await scheduleCategoryNotifications("youth", setting);
    await scheduleCategoryNotifications("choir", setting);

    expect((await listScheduled()).map((n) => n.key).sort()).toEqual([
      "calendar:choir:a",
      "calendar:youth:a",
    ]);
  });

  it("skips events that are past or have an unreadable start", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    await storeEvents("youth", [
      event("soon", "2099-01-01T09:00:00.000Z"),
      event("bad", "not a date"),
    ]);

    await scheduleCategoryNotifications("youth", {
      enabled: true,
      daysBefore: 1,
    });

    expect(await listScheduled()).toEqual([]);
  });

  it("does not keep its own record in AsyncStorage", async () => {
    await storeEvents("youth", [event("a")]);

    await scheduleCategoryNotifications("youth", {
      enabled: true,
      daysBefore: 1,
    });

    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter((k) => k.startsWith("notified-"))).toEqual([]);
  });
});
