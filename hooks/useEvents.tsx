import { useState, useEffect, useMemo } from "react";
import {
  API_KEY,
  YOUTH_EVENTS_BASE_URL,
  WEEKLY_EVENTS_BASE_URL,
  CHURCH_EVENTS_BASE_URL,
  FAMILY_EVENTS_BASE_URL,
  LADIES_EVENTS_BASE_URL,
  PARISH_COUNCIL_EVENTS_BASE_URL,
  SENIORS_EVENTS_BASE_URL,
  PLAYGROUP_EVENTS_BASE_URL,
  FELLOWSHIP_EVENTS_BASE_URL,
  CALENDAR_NOTIFICATION_SETTINGS,
} from "@/constants/consts";
import { EventData } from "@/types/global";
import { groupEventsByDay } from "@/utils/dateUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scheduleNotification } from "@/notifications";

const EVENT_SOURCES = [
  { url: YOUTH_EVENTS_BASE_URL, source: "youth" },
  { url: WEEKLY_EVENTS_BASE_URL, source: "weekly" },
  { url: CHURCH_EVENTS_BASE_URL, source: "church" },
  { url: FAMILY_EVENTS_BASE_URL, source: "family" },
  { url: LADIES_EVENTS_BASE_URL, source: "ladies" },
  { url: PARISH_COUNCIL_EVENTS_BASE_URL, source: "parish" },
  { url: SENIORS_EVENTS_BASE_URL, source: "seniors" },
  { url: PLAYGROUP_EVENTS_BASE_URL, source: "playgroup" },
  { url: FELLOWSHIP_EVENTS_BASE_URL, source: "fellowship" },
];

export const useEvents = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const storedSettings = await AsyncStorage.getItem(
        CALENDAR_NOTIFICATION_SETTINGS
      );
      const calendarSettings = storedSettings ? JSON.parse(storedSettings) : {};
      const allEvents: EventData[] = [];

      await Promise.all(
        EVENT_SOURCES.map(async ({ url, source }) => {
          const response = await fetch(
            `${url}?key=${API_KEY}&timeMin=${new Date().toISOString()}&singleEvents=true&orderBy=startTime`
          );
          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
          const data = await response.json();

          const formattedEvents: EventData[] = [];

          for (const item of data.items) {
            if (item.visibility === "private") continue;

            const eventStart = new Date(item.start.dateTime || item.start.date);
            const calendar = source;

            const settings = calendarSettings[calendar];
            if (settings?.enabled) {
              const notifyTime = new Date(eventStart);
              notifyTime.setDate(notifyTime.getDate() - settings.daysBefore);

              if (notifyTime > new Date()) {
                await scheduleNotification(
                  item.summary || "Upcoming event",
                  `(${calendar})`,
                  notifyTime
                );
              }
            }

            formattedEvents.push({
              id: item.id,
              title: item.summary || "No Title",
              start: eventStart.toISOString(),
              end: item.end?.dateTime || item.end?.date || "",
              description: item.description,
              location: item.location,
              source: calendar,
              data: []
            });
          }

          allEvents.push(...formattedEvents);
        })
      );

      setEvents(
        allEvents.sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        )
      );
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const groupedEvents = useMemo(() => groupEventsByDay(events), [events]);

  return { events, groupedEvents, loading, refetch: fetchAllEvents };
};
