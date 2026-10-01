import { create } from "zustand";

import type { EventData } from "@/types/global";

import {
  addFavourite,
  favouriteKey,
  getFavourites,
  removeExpiredFavourites,
  removeFavourite,
} from "./favouritesRepository";

// Application-wide favourites state. The repository stays the only code that
// touches AsyncStorage; this store holds every favourite in memory so each
// event row can check its star synchronously instead of reading storage.
// Call hydrate() once at app startup to load the persisted favourites.
interface FavouritesState {
  favourites: Record<string, EventData>;
  hydrated: boolean;
  isFavourite: (event: EventData) => boolean;
  // Persists the change, then updates the store. Resolves to the new
  // favourite status and rejects (leaving the store unchanged) if saving fails.
  toggle: (event: EventData) => Promise<boolean>;
  // Drops expired favourites from storage and the store, and returns the
  // upcoming ones.
  removeExpired: () => Promise<EventData[]>;
  hydrate: () => Promise<void>;
}

const toRecord = (events: EventData[]) =>
  Object.fromEntries(events.map((event) => [favouriteKey(event), event]));

export const useFavouritesStore = create<FavouritesState>((set, get) => ({
  favourites: {},
  hydrated: false,

  isFavourite: (event) => favouriteKey(event) in get().favourites,

  toggle: async (event) => {
    const key = favouriteKey(event);
    const becomesFavourite = !(key in get().favourites);

    if (becomesFavourite) {
      await addFavourite(event);
    } else {
      await removeFavourite(event);
    }

    set((state) => {
      const favourites = { ...state.favourites };
      if (becomesFavourite) {
        favourites[key] = event;
      } else {
        delete favourites[key];
      }
      return { favourites };
    });
    return becomesFavourite;
  },

  removeExpired: async () => {
    const upcoming = await removeExpiredFavourites();
    set({ favourites: toRecord(upcoming) });
    return upcoming;
  },

  hydrate: async () => {
    try {
      set({ favourites: toRecord(await getFavourites()) });
    } catch (e) {
      // Start with no favourites rather than blocking the app.
      console.error("Failed to load favourites", e);
    } finally {
      set({ hydrated: true });
    }
  },
}));
