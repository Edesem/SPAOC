import { scheduleCategoryNotifications as scheduleCalendarNotifications } from "@/services/notifications";
import { useState } from "react";

// Calendar states
export const [calendarSettings, setCalendarSettings] = useState<{
  [key: string]: { enabled: boolean; daysBefore: number };
}>({});

export {
  cancelAllFavouriteNotifications,
  cancelAllSaintNotifications,
  scheduleFavouriteNotifications,
  scheduleSaintNotificationsForNext7Days,
} from "@/services/notifications";

export const scheduleCategoryNotifications = (calendar: string) =>
  scheduleCalendarNotifications(calendar, calendarSettings[calendar]);
