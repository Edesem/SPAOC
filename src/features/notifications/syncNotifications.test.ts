import { atParishHour, parishDayKey, setNow } from "@/lib/parishTime";
import { useSettingsStore } from "@/services/settings";
import * as Notifications from "expo-notifications";

import { listScheduled, schedule } from "./notificationGateway";
import { SAINT_DAYS_AHEAD, syncNotifications } from "./syncNotifications";

jest.mock("expo-notifications", () =>
  jest
    .requireActual("@/test-utils/fakeExpoNotifications")
    .createFakeExpoNotifications(),
);

const mockGetSaintsForDateOrThrow = jest.fn<Promise<string[]>, [Date]>();
jest.mock("@/features/calendar", () => ({
  calendarService: {
    getSaintsForDateOrThrow: (date: Date) => mockGetSaintsForDateOrThrow(date),
  },
}));

const scheduleSpy = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelSpy = Notifications.cancelScheduledNotificationAsync as jest.Mock;

// 5am on 1 Jan 2099 in Melbourne, so that day's 8am notification is still ahead
const EARLY_MORNING = new Date("2098-12-31T18:00:00.000Z");
const dayKey = (offset: number) =>
  parishDayKey(atParishHour(EARLY_MORNING, 12, offset));

const saintsByOffset = (byOffset: Record<number, string[]>) =>
  mockGetSaintsForDateOrThrow.mockImplementation(async (date) => {
    const offset = [0, 1, 2, 3, 4, 5, 6].find(
      (i) => dayKey(i) === parishDayKey(date),
    );
    return (offset !== undefined && byOffset[offset]) || [];
  });

const scheduledKeys = async () => (await listScheduled()).map((n) => n.key);

const calendarNotification = {
  key: "calendar:youth:abc",
  kind: "calendar" as const,
  title: "Youth night coming up!",
  body: "Start time: 7:00 pm",
  fireAt: atParishHour(EARLY_MORNING, 9, 3),
};

beforeEach(() => {
  (Notifications as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
  setNow(() => EARLY_MORNING);
  useSettingsStore.setState({ dailySaintsEnabled: true });
  saintsByOffset({ 0: ["St Paul"], 1: ["St Peter", "St John"] });
  // A failed load is logged; keep that out of the test output
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  setNow(() => new Date());
  jest.restoreAllMocks();
});

describe("syncNotifications", () => {
  it("schedules a keyed 8am notification for each of the next days that has saints", async () => {
    await syncNotifications();

    expect(
      (await listScheduled()).map(({ key, kind, title, body, fireAt }) => ({
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
        fireAt: atParishHour(EARLY_MORNING, 8, 0),
      },
      {
        key: `saint:${dayKey(1)}`,
        kind: "saint",
        title: "Saint of the Day",
        body: "St Peter, St John",
        fireAt: atParishHour(EARLY_MORNING, 8, 1),
      },
    ]);
  });

  it("loads SAINT_DAYS_AHEAD days of saints", async () => {
    await syncNotifications();

    expect(mockGetSaintsForDateOrThrow).toHaveBeenCalledTimes(SAINT_DAYS_AHEAD);
  });

  it("does not schedule today once its 8am has passed", async () => {
    setNow(() => atParishHour(EARLY_MORNING, 9));

    await syncNotifications();

    expect(await scheduledKeys()).toEqual([`saint:${dayKey(1)}`]);
  });

  describe("when run again with nothing changed", () => {
    it("cancels and schedules nothing", async () => {
      await syncNotifications();
      scheduleSpy.mockClear();
      cancelSpy.mockClear();

      await syncNotifications();

      expect(scheduleSpy).not.toHaveBeenCalled();
      expect(cancelSpy).not.toHaveBeenCalled();
      expect(await listScheduled()).toHaveLength(2);
    });
  });

  it("replaces a saint whose names changed, rather than duplicating it", async () => {
    await syncNotifications();
    saintsByOffset({ 0: ["St Paul", "St Silas"], 1: ["St Peter", "St John"] });

    await syncNotifications();

    const scheduled = await listScheduled();
    expect(scheduled.map((n) => n.key)).toEqual([
      `saint:${dayKey(1)}`,
      `saint:${dayKey(0)}`,
    ]);
    expect(scheduled.find((n) => n.key === `saint:${dayKey(0)}`)?.body).toBe(
      "St Paul, St Silas",
    );
  });

  it("cancels a scheduled notification that has no key and replaces it with a keyed one", async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title: "Saint of the Day", body: "St Paul" },
      trigger: null,
    });

    await syncNotifications();

    const scheduled = await listScheduled();
    expect(scheduled).toHaveLength(2);
    expect(scheduled.every((n) => n.key !== null)).toBe(true);
  });

  describe("when the saints cannot be loaded", () => {
    it("leaves the existing schedule untouched", async () => {
      await syncNotifications();
      const before = await listScheduled();
      scheduleSpy.mockClear();
      cancelSpy.mockClear();
      mockGetSaintsForDateOrThrow.mockRejectedValue(new Error("offline"));

      await syncNotifications();

      expect(cancelSpy).not.toHaveBeenCalled();
      expect(scheduleSpy).not.toHaveBeenCalled();
      expect(await listScheduled()).toEqual(before);
    });

    it("leaves the schedule untouched when only one day fails", async () => {
      await syncNotifications();
      const before = await listScheduled();
      mockGetSaintsForDateOrThrow.mockImplementation(async (date) => {
        if (parishDayKey(date) === dayKey(3)) throw new Error("offline");
        return [];
      });

      await syncNotifications();

      expect(await listScheduled()).toEqual(before);
    });

    it("resolves rather than rejecting", async () => {
      mockGetSaintsForDateOrThrow.mockRejectedValue(new Error("offline"));

      await expect(syncNotifications()).resolves.toBeUndefined();
    });
  });

  describe("when daily saints are switched off", () => {
    beforeEach(() => {
      useSettingsStore.setState({ dailySaintsEnabled: false });
    });

    it("cancels every saint notification, keyed or not, and leaves other kinds", async () => {
      useSettingsStore.setState({ dailySaintsEnabled: true });
      await syncNotifications();
      await Notifications.scheduleNotificationAsync({
        content: { title: "Saint of the Day", body: "Old" },
        trigger: null,
      });
      await schedule(calendarNotification);
      useSettingsStore.setState({ dailySaintsEnabled: false });

      await syncNotifications();

      expect(await scheduledKeys()).toEqual(["calendar:youth:abc"]);
    });

    it("does not need the network to cancel", async () => {
      useSettingsStore.setState({ dailySaintsEnabled: true });
      await syncNotifications();
      mockGetSaintsForDateOrThrow.mockClear();
      useSettingsStore.setState({ dailySaintsEnabled: false });

      await syncNotifications();

      expect(mockGetSaintsForDateOrThrow).not.toHaveBeenCalled();
      expect(await listScheduled()).toEqual([]);
    });
  });

  describe("overlapping runs", () => {
    it("do not double-schedule when two run at once", async () => {
      await Promise.all([syncNotifications(), syncNotifications()]);

      expect(scheduleSpy).toHaveBeenCalledTimes(2);
      expect(await listScheduled()).toHaveLength(2);
    });

    it("run once more afterwards when another is requested mid-run", async () => {
      let release: () => void = () => {};
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockGetSaintsForDateOrThrow.mockImplementationOnce(async () => {
        await gate;
        return ["St Paul"];
      });

      const first = syncNotifications();
      // The settings change arrives while the first run is still loading
      useSettingsStore.setState({ dailySaintsEnabled: false });
      const second = syncNotifications();
      release();
      await Promise.all([first, second]);

      expect(await listScheduled()).toEqual([]);
    });

    it("do not queue more than one extra run", async () => {
      const runs = [
        syncNotifications(),
        syncNotifications(),
        syncNotifications(),
        syncNotifications(),
      ];
      await Promise.all(runs);

      // One run for the first call, one more for the three that overlapped it
      expect(mockGetSaintsForDateOrThrow).toHaveBeenCalledTimes(14);
    });
  });
});
