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
} from "@/constants/consts";
import { EventData } from "@/types/global";
import { groupEventsByDay } from "@/utils/dateUtils";
import { useSettingsStore } from "@/app/settings";

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
  const [loading, setLoading] = useState(false);

  const startOfWeek = useSettingsStore.getState().startOfWeek; // "sunday" | "monday"

  const fetchAllEvents = () => {
    setLoading(true);

    const now = new Date();
    const timeMin = now.toISOString();

    const fetchPromises = EVENT_SOURCES.map(({ url, source }) => {
      const fullUrl = `${url}?key=${API_KEY}&timeMin=${timeMin}&singleEvents=true&orderBy=startTime`;

      return fetch(fullUrl)
        .then((response) => response.json())
        .then((data) => {
          const formattedEvents: EventData[] = [];

          for (const item of data.items || []) {
            if (item.visibility === "private") continue;

            const eventStart = new Date(item.start.dateTime || item.start.date);

            formattedEvents.push({
              id: item.id,
              title: item.summary || "No Title",
              start: eventStart.toISOString(),
              end: item.end?.dateTime || item.end?.date || "",
              description: item.description,
              location: item.location,
              source: source,
              data: [],
            });
          }

          return formattedEvents;
        })
        .catch((error) => {
          console.error(`Error fetching ${source}:`, error);
          return [];
        });
    });

    Promise.all(fetchPromises)
      .then((results) => {
        const allEvents = results.flat();
        const sorted = allEvents.sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        );
        setEvents(sorted);
      })
      .catch((error) => {
        console.error("Error in Promise.all:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const groupedEvents = useMemo(() => {
    return groupEventsByDay(events, startOfWeek);
  }, [events, startOfWeek]);

  return {
    events,
    groupedEvents,
    loading,
    refetch: fetchAllEvents,
  };
};
