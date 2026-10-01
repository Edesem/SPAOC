import { calendarService, type CalendarEvent } from "@/services/calendar";
import { useSettingsStore } from "@/services/settings";
import { groupEventsByDay } from "@/utils/dateUtils";
import { useCallback, useEffect, useMemo, useState } from "react";

// Compatibility wrapper over calendarService that keeps the hook's original
// return shape for existing screens.
export const useEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const startOfWeek = useSettingsStore((state) => state.startOfWeek); // "sunday" | "monday"

  const fetchAllEvents = useCallback(() => {
    setLoading(true);

    calendarService
      .getParishEvents()
      .then(setEvents)
      .catch((error) => {
        console.error("Error fetching events:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

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
