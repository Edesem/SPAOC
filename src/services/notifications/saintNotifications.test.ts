import { atParishHour, parishDayKey, setNow } from "@/lib/parishTime";
import { saveDailySaintNotificationsEnabled } from "@/services/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import { listScheduled, schedule } from "./notificationGateway";
import {
  cancelAllSaintNotifications,
  scheduleSaintNotificationsForNext7Days,
} from "./saintNotifications";

jest.mock("expo-notifications", () =>
  jest
    .requireActual("@/test-utils/fakeExpoNotifications")
    .createFakeExpoNotifications(),
);

const mockGetSaintsForDate = jest.fn<Promise<string[]>, [Date]>();
jest.mock("@/services/calendar", () => ({
  calendarService: {
    getSaintsForDate: (date: Date) => mockGetSaintsForDate(date),
  },
}));

// 5am on 1 Jan 2099 in Melbourne, so that day's 8am notification is still ahead
const EARLY_MORNING = new Date("2098-12-31T18:00:00.000Z");
const today = EARLY_MORNING;
const dayKey = (offset: number) =>
  parishDayKey(atParishHour(today, 12, offset));

const saintsByOffset = (byOffset: Record<number, string[]>) =>
  mockGetSaintsForDate.mockImplementation(async (date) => {
    const offset = [0, 1, 2, 3, 4, 5, 6].find(
      (i) => parishDayKey(atParishHour(today, 12, i)) === parishDayKey(date),
    );
    return (offset !== undefined && byOffset[offset]) || [];
  });

beforeEach(async () => {
  await AsyncStorage.clear();
  (Notifications as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
  setNow(() => EARLY_MORNING);
  await saveDailySaintNotificationsEnabled(true);
  saintsByOffset({ 0: ["St Paul"], 1: ["St Peter", "St John"] });
});

afterEach(() => setNow(() => new Date()));

describe("scheduleSaintNotificationsForNext7Days", () => {
  it("schedules a keyed 8am notification for each day that has saints", async () => {
    await scheduleSaintNotificationsForNext7Days();

    const scheduled = await listScheduled();
    expect(
      scheduled.map(({ key, kind, title, body, fireAt }) => ({
        key,
        kind,
        title,
        body,
        fireAt,
      })),
    ).toEqual([
      {
        key: `saint:${dayKey(0)}`,
        kind: "saint",
        title: "Saint of the Day",
        body: "St Paul",
        fireAt: atParishHour(today, 8, 0),
      },
      {
        key: `saint:${dayKey(1)}`,
        kind: "saint",
        title: "Saint of the Day",
        body: "St Peter, St John",
        fireAt: atParishHour(today, 8, 1),
      },
    ]);
  });

  it("does nothing when daily saint notifications are off", async () => {
    await saveDailySaintNotificationsEnabled(false);

    await scheduleSaintNotificationsForNext7Days();

    expect(await listScheduled()).toEqual([]);
  });

  it("does not schedule a day twice when run again", async () => {
    await scheduleSaintNotificationsForNext7Days();
    await scheduleSaintNotificationsForNext7Days();

    expect(await listScheduled()).toHaveLength(2);
  });

  it("does not schedule today once its 8am has passed", async () => {
    setNow(() => atParishHour(today, 9));

    await scheduleSaintNotificationsForNext7Days();

    expect((await listScheduled()).map((n) => n.key)).toEqual([
      `saint:${dayKey(1)}`,
    ]);
  });

  it("does not keep its own record in AsyncStorage", async () => {
    await scheduleSaintNotificationsForNext7Days();

    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter((k) => k.startsWith("notified-"))).toEqual([]);
  });

  it("replaces a saint notification scheduled before keys existed", async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title: "Saint of the Day", body: "St Paul" },
      trigger: null,
    });

    await scheduleSaintNotificationsForNext7Days();

    const scheduled = await listScheduled();
    expect(scheduled).toHaveLength(2);
    expect(scheduled.every((n) => n.key !== null)).toBe(true);
  });
});

describe("cancelAllSaintNotifications", () => {
  it("cancels every saint notification, keyed or not, and leaves others", async () => {
    await scheduleSaintNotificationsForNext7Days();
    await Notifications.scheduleNotificationAsync({
      content: { title: "Saint of the Day", body: "Old" },
      trigger: null,
    });
    await schedule({
      key: "calendar:youth:abc",
      kind: "calendar",
      title: "Youth night coming up!",
      body: "Start time: 7:00 pm",
      fireAt: atParishHour(today, 9, 3),
    });

    await cancelAllSaintNotifications();

    expect((await listScheduled()).map((n) => n.key)).toEqual([
      "calendar:youth:abc",
    ]);
  });
});
