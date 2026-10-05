import { now as appNow } from "@/lib/parishTime";
import type { EventData } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Favourites are persisted under a single AsyncStorage key as a JSON object
// mapping each event's key (its id, falling back to its title) to the event.
// This module is the only place that knows about that format.
const FAVOURITES_KEY = "favourites";

type StoredFavourites = Record<string, EventData>;

export const favouriteKey = (event: EventData) => event.id ?? event.title;

// Throws if the stored value is not valid JSON, so callers can decide how to
// report a corrupted store.
const readFavourites = async (): Promise<StoredFavourites> => {
  const stored = await AsyncStorage.getItem(FAVOURITES_KEY);
  return stored ? JSON.parse(stored) : {};
};

const writeFavourites = (favourites: StoredFavourites) =>
  AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));

export async function getFavourites(): Promise<EventData[]> {
  return Object.values(await readFavourites());
}

export async function isFavourite(event: EventData): Promise<boolean> {
  const favourites = await readFavourites();
  return !!favourites[favouriteKey(event)];
}

export async function addFavourite(event: EventData): Promise<void> {
  const favourites = await readFavourites();
  favourites[favouriteKey(event)] = event;
  await writeFavourites(favourites);
}

export async function removeFavourite(event: EventData): Promise<void> {
  const favourites = await readFavourites();
  delete favourites[favouriteKey(event)];
  await writeFavourites(favourites);
}

// Permanently drops favourites whose end time is not after `now` and returns
// the ones that remain. Leaves storage untouched when there are no favourites.
export async function removeExpiredFavourites(
  now: Date = appNow(),
): Promise<EventData[]> {
  const favourites = await getFavourites();
  if (favourites.length === 0) return [];

  const upcoming = favourites.filter((event) => new Date(event.end) > now);

  await writeFavourites(
    Object.fromEntries(upcoming.map((event) => [favouriteKey(event), event])),
  );
  return upcoming;
}
