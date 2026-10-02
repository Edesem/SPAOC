import { atParishHour, setNow } from "@/domain/parishTime";
import { getFavourites } from "@/services/favourites";
import { saveFavouriteNotificationsEnabled } from "@/services/settings";
import type { EventData } from "@/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import {
  cancelAllFavouriteNotifications,
  scheduleFavouriteNotifications,
} from "./favouriteNotifications";
import { listScheduled, schedule } from "./notificationGateway";

jest.mock("expo-notifications", () =>
  jest
    .requireActual("@/test-utils/fakeExpoNotifications")
    .createFakeExpoNotifications(),
);

jest.mock("@/services/favourites", () => ({ getFavourites: jest.fn() }));

const NOW = new Date("2098-12-31T18:00:00.000Z");

const favourite = (id: string, start: string) =>
  ({
    id,
    title: `Event ${id}`,
    start,
    end: start,
    description: "",
    location: "",
    source: "church",
  }) as EventData;

beforeEach(async () => {
  await AsyncStorage.clear();
  (Notifications as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
  setNow(() => NOW);
  await saveFavouriteNotificationsEnabled(true);
  (getFavourites as jest.Mock).mockResolvedValue([
    favourite("a", "2099-01-20T09:00:00.000Z"),
  ]);
});

afterEach(() => setNow(() => new Date()));

describe("scheduleFavouriteNotifications", () => {
  it("schedules a notification keyed by the event five days before at 9am", async () => {
    await scheduleFavouriteNotifications();

    expect(await listScheduled()).toEqual([
      expect.objectContaining({
        key: "favourite:a",
        kind: "favourite",
        title: "Event a in 5 days!",
        fireAt: atParishHour(new Date("2099-01-20T09:00:00.000Z"), 9, -5),
      }),
    ]);
  });

  it("does nothing when favourite notifications are off", async () => {
    await saveFavouriteNotificationsEnabled(false);

    await scheduleFavouriteNotifications();

    expect(await listScheduled()).toEqual([]);
  });

  it("does not schedule an event twice when run again", async () => {
    await scheduleFavouriteNotifications();
    await scheduleFavouriteNotifications();

    expect(await listScheduled()).toHaveLength(1);
  });

  it("skips an event whose notification time has passed", async () => {
    (getFavourites as jest.Mock).mockResolvedValue([
      favourite("soon", "2099-01-03T09:00:00.000Z"),
    ]);

    await scheduleFavouriteNotifications();

    expect(await listScheduled()).toEqual([]);
  });

  it("skips an event with an unreadable start", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    (getFavourites as jest.Mock).mockResolvedValue([
      favourite("bad", "not a date"),
    ]);

    await scheduleFavouriteNotifications();

    expect(await listScheduled()).toEqual([]);
  });

  it("does not keep its own record in AsyncStorage", async () => {
    await scheduleFavouriteNotifications();

    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter((k) => k.startsWith("notified-"))).toEqual([]);
  });
});

describe("cancelAllFavouriteNotifications", () => {
  it("cancels favourite notifications whatever their title and leaves others", async () => {
    await scheduleFavouriteNotifications();
    await schedule({
      key: "saint:2099-01-02",
      kind: "saint",
      title: "Saint of the Day",
      body: "St Paul",
      fireAt: atParishHour(NOW, 8, 1),
    });

    await cancelAllFavouriteNotifications();

    expect((await listScheduled()).map((n) => n.key)).toEqual([
      "saint:2099-01-02",
    ]);
  });
});
