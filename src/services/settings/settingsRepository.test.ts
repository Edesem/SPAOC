import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCalendarNotificationSettings,
  getStartOfWeek,
  getThemeChoice,
  isDailySaintNotificationsEnabled,
  isFavouriteNotificationsEnabled,
  saveCalendarNotificationSettings,
  saveDailySaintNotificationsEnabled,
  saveFavouriteNotificationsEnabled,
  saveStartOfWeek,
  saveThemeChoice,
} from "./settingsRepository";

const DAILY_SAINTS = "dailySaintsNotificationsEnabled";
const FAVOURITES = "favouriteNotificationsEnabled";
const CALENDARS = "calendarNotificationSettings";

describe("settingsRepository", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe("start of week", () => {
    it("reads a value saved in the existing format", async () => {
      await AsyncStorage.setItem("START_OF_WEEK", "sunday");

      expect(await getStartOfWeek()).toBe("sunday");
    });

    it("returns null when nothing or an unrecognised value is stored", async () => {
      expect(await getStartOfWeek()).toBeNull();

      await AsyncStorage.setItem("START_OF_WEEK", "tuesday");
      expect(await getStartOfWeek()).toBeNull();
    });

    it("saves the value as a plain string", async () => {
      await saveStartOfWeek("monday");

      expect(await AsyncStorage.getItem("START_OF_WEEK")).toBe("monday");
    });
  });

  describe("theme", () => {
    it.each(["light", "dark", "auto"] as const)(
      "reads a saved %s theme",
      async (choice) => {
        await AsyncStorage.setItem("APP_THEME", choice);

        expect(await getThemeChoice()).toBe(choice);
      },
    );

    it("falls back to auto when nothing or an unrecognised value is stored", async () => {
      expect(await getThemeChoice()).toBe("auto");

      await AsyncStorage.setItem("APP_THEME", "sepia");
      expect(await getThemeChoice()).toBe("auto");
    });

    it("saves the choice as a plain string", async () => {
      await saveThemeChoice("dark");

      expect(await AsyncStorage.getItem("APP_THEME")).toBe("dark");
    });
  });

  describe.each([
    [
      "daily saints",
      DAILY_SAINTS,
      isDailySaintNotificationsEnabled,
      saveDailySaintNotificationsEnabled,
    ],
    [
      "favourites",
      FAVOURITES,
      isFavouriteNotificationsEnabled,
      saveFavouriteNotificationsEnabled,
    ],
  ])("%s notification flag", (_, key, isEnabled, save) => {
    it("is on unless stored as 'false', so unset matches what Settings shows", async () => {
      expect(await isEnabled()).toBe(true);

      await AsyncStorage.setItem(key, "false");
      expect(await isEnabled()).toBe(false);

      await AsyncStorage.setItem(key, "true");
      expect(await isEnabled()).toBe(true);
    });

    it("saves the flag as a 'true'/'false' string", async () => {
      await save(true);
      expect(await AsyncStorage.getItem(key)).toBe("true");

      await save(false);
      expect(await AsyncStorage.getItem(key)).toBe("false");
    });
  });

  describe("calendar notification settings", () => {
    it("loads settings saved in the existing format without rewriting them", async () => {
      const saved = { youth: { enabled: true, daysBefore: 3 } };
      await AsyncStorage.setItem(CALENDARS, JSON.stringify(saved));
      jest.clearAllMocks();

      expect(await getCalendarNotificationSettings()).toEqual(saved);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("saves and returns disabled one-day defaults when nothing is stored", async () => {
      const settings = await getCalendarNotificationSettings();

      expect(Object.keys(settings)).toEqual([
        "youth",
        "church",
        "family",
        "ladies",
        "parish",
        "seniors",
        "weekly",
        "playgroup",
        "fellowship",
      ]);
      Object.values(settings).forEach((setting) =>
        expect(setting).toEqual({ enabled: false, daysBefore: 1 }),
      );
      expect(JSON.parse((await AsyncStorage.getItem(CALENDARS))!)).toEqual(
        settings,
      );
    });

    it("saves settings as JSON", async () => {
      const settings = {
        church: { enabled: true, daysBefore: 2 },
        youth: { enabled: false, daysBefore: 1 },
      };

      await saveCalendarNotificationSettings(settings);

      expect(JSON.parse((await AsyncStorage.getItem(CALENDARS))!)).toEqual(
        settings,
      );
    });

    it("rejects when the stored value is not valid JSON", async () => {
      await AsyncStorage.setItem(CALENDARS, "not valid JSON");

      await expect(getCalendarNotificationSettings()).rejects.toThrow(
        SyntaxError,
      );
    });
  });
});
