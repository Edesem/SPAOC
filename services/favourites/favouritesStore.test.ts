import type { EventData } from "@/types/global";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useFavouritesStore } from "./favouritesStore";

const initialState = useFavouritesStore.getState();

const event = (id: string, end = "2099-01-01T10:00:00.000Z") =>
  ({
    id,
    title: `Event ${id}`,
    start: end,
    end,
    description: "",
    location: "",
    source: "church",
  }) as EventData;

const storedJson = async () =>
  JSON.parse((await AsyncStorage.getItem("favourites")) ?? "null");

describe("favouritesStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
    useFavouritesStore.setState(initialState, true);
  });

  it("starts empty and not hydrated", () => {
    const state = useFavouritesStore.getState();

    expect(state.favourites).toEqual({});
    expect(state.isFavourite(event("a"))).toBe(false);
    expect(state.hydrated).toBe(false);
  });

  describe("hydrate", () => {
    it("loads the persisted favourites with a single storage read", async () => {
      const a = event("a");
      const b = event("b");
      await AsyncStorage.setItem("favourites", JSON.stringify({ a, b }));
      const getItem = jest.spyOn(AsyncStorage, "getItem");
      getItem.mockClear();

      await useFavouritesStore.getState().hydrate();

      const state = useFavouritesStore.getState();
      expect(getItem).toHaveBeenCalledTimes(1);
      expect(state.isFavourite(a)).toBe(true);
      expect(state.isFavourite(b)).toBe(true);
      expect(state.isFavourite(event("c"))).toBe(false);
      expect(state.hydrated).toBe(true);
    });

    it("checks favourites without touching storage", async () => {
      const a = event("a");
      await AsyncStorage.setItem("favourites", JSON.stringify({ a }));
      await useFavouritesStore.getState().hydrate();
      const getItem = jest.spyOn(AsyncStorage, "getItem");
      getItem.mockClear();

      useFavouritesStore.getState().isFavourite(a);

      expect(getItem).not.toHaveBeenCalled();
    });

    it("starts empty, logs, and still marks hydrated when storage is corrupted", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      await AsyncStorage.setItem("favourites", "not json");

      await useFavouritesStore.getState().hydrate();

      const state = useFavouritesStore.getState();
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to load favourites",
        expect.any(SyntaxError),
      );
      expect(state.favourites).toEqual({});
      expect(state.hydrated).toBe(true);
    });
  });

  describe("toggle", () => {
    it("favourites an event in the store and storage", async () => {
      const a = event("a");

      const result = await useFavouritesStore.getState().toggle(a);

      expect(result).toBe(true);
      expect(useFavouritesStore.getState().isFavourite(a)).toBe(true);
      expect(await storedJson()).toEqual({ a });
    });

    it("unfavourites an event in the store and storage", async () => {
      const a = event("a");
      await AsyncStorage.setItem("favourites", JSON.stringify({ a }));
      await useFavouritesStore.getState().hydrate();

      const result = await useFavouritesStore.getState().toggle(a);

      expect(result).toBe(false);
      expect(useFavouritesStore.getState().isFavourite(a)).toBe(false);
      expect(await storedJson()).toEqual({});
    });

    it("keeps the store unchanged and rejects when saving fails", async () => {
      const failure = new Error("storage unavailable");
      jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(failure);

      await expect(
        useFavouritesStore.getState().toggle(event("a")),
      ).rejects.toBe(failure);

      expect(useFavouritesStore.getState().favourites).toEqual({});
    });

    it("identifies events without an id by their title", async () => {
      const untitled = { ...event("a"), id: undefined } as unknown as EventData;

      await useFavouritesStore.getState().toggle(untitled);

      expect(useFavouritesStore.getState().isFavourite(untitled)).toBe(true);
    });
  });

  describe("removeExpired", () => {
    it("drops expired favourites from the store and returns the upcoming ones", async () => {
      const past = event("past", "2000-01-01T10:00:00.000Z");
      const upcoming = event("upcoming");
      await AsyncStorage.setItem(
        "favourites",
        JSON.stringify({ past, upcoming }),
      );
      await useFavouritesStore.getState().hydrate();

      const result = await useFavouritesStore.getState().removeExpired();

      const state = useFavouritesStore.getState();
      expect(result).toEqual([upcoming]);
      expect(state.isFavourite(past)).toBe(false);
      expect(state.isFavourite(upcoming)).toBe(true);
      expect(await storedJson()).toEqual({ upcoming });
    });
  });
});
