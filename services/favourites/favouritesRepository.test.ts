import type { EventData } from "@/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addFavourite,
  getFavourites,
  isFavourite,
  removeExpiredFavourites,
  removeFavourite,
} from "./favouritesRepository";

const event = (id: string, end: string, extra: Partial<EventData> = {}) =>
  ({
    id,
    title: `Event ${id}`,
    start: end,
    end,
    description: "",
    location: "",
    source: "church",
    ...extra,
  }) as EventData;

const storedJson = async () =>
  JSON.parse((await AsyncStorage.getItem("favourites")) ?? "null");

describe("favouritesRepository", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe("existing stored data", () => {
    it("loads favourites saved in the existing format", async () => {
      const a = event("a", "2099-01-01T10:00:00.000Z");
      const b = event("b", "2099-01-02T10:00:00.000Z");
      await AsyncStorage.setItem("favourites", JSON.stringify({ a, b }));

      expect(await getFavourites()).toEqual([a, b]);
      expect(await isFavourite(a)).toBe(true);
    });

    it("returns no favourites when nothing is stored", async () => {
      expect(await getFavourites()).toEqual([]);
      expect(await isFavourite(event("a", "2099-01-01"))).toBe(false);
    });

    it("rejects when the stored value is not valid JSON", async () => {
      await AsyncStorage.setItem("favourites", "not valid JSON");

      await expect(getFavourites()).rejects.toThrow(SyntaxError);
      await expect(isFavourite(event("a", "2099-01-01"))).rejects.toThrow(
        SyntaxError,
      );
    });
  });

  describe("addFavourite", () => {
    it("stores the event keyed by its id", async () => {
      const a = event("a", "2099-01-01T10:00:00.000Z");

      await addFavourite(a);

      expect(await storedJson()).toEqual({ a });
      expect(await isFavourite(a)).toBe(true);
    });

    it("keys events without an id by their title", async () => {
      const untitled = event("", "2099-01-01", { title: "Vespers" });
      delete (untitled as Partial<EventData>).id;

      await addFavourite(untitled);

      expect(await storedJson()).toEqual({ Vespers: untitled });
      expect(await isFavourite(untitled)).toBe(true);
    });

    it("keeps existing favourites and replaces one with the same key", async () => {
      const a = event("a", "2099-01-01");
      const b = event("b", "2099-01-02");
      const renamedA = { ...a, title: "Renamed" };

      await addFavourite(a);
      await addFavourite(b);
      await addFavourite(renamedA);

      expect(await storedJson()).toEqual({ a: renamedA, b });
    });
  });

  describe("removeFavourite", () => {
    it("removes only the given event", async () => {
      const a = event("a", "2099-01-01");
      const b = event("b", "2099-01-02");
      await addFavourite(a);
      await addFavourite(b);

      await removeFavourite(a);

      expect(await storedJson()).toEqual({ b });
      expect(await isFavourite(a)).toBe(false);
    });

    it("is a no-op for an event that is not a favourite", async () => {
      const a = event("a", "2099-01-01");
      await addFavourite(a);

      await removeFavourite(event("missing", "2099-01-01"));

      expect(await storedJson()).toEqual({ a });
    });
  });

  describe("removeExpiredFavourites", () => {
    const now = new Date("2025-06-01T12:00:00.000Z");

    it("drops favourites that have ended and persists the rest", async () => {
      const past = event("past", "2025-06-01T11:59:59.000Z");
      const endingNow = event("now", "2025-06-01T12:00:00.000Z");
      const future = event("future", "2025-06-01T12:00:01.000Z");
      await AsyncStorage.setItem(
        "favourites",
        JSON.stringify({ past, now: endingNow, future }),
      );

      expect(await removeExpiredFavourites(now)).toEqual([future]);
      expect(await storedJson()).toEqual({ future });
    });

    it("does not write to storage when nothing is stored", async () => {
      expect(await removeExpiredFavourites(now)).toEqual([]);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("rejects when the stored value is not valid JSON", async () => {
      await AsyncStorage.setItem("favourites", "not valid JSON");

      await expect(removeExpiredFavourites(now)).rejects.toThrow(SyntaxError);
    });
  });
});
