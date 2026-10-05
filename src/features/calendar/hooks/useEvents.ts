import { calendarService, type CalendarEvent } from "../services";
import { useSettingsStore } from "@/services/settings";
import { groupEventsByDay } from "../domain/dateUtils";
import { useCallback, useEffect, useMemo, useState } from "react";

// Compatibility wrapper over calendarService that keeps the hook's original
// return shape for existing screens.
export const useEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startOfWeek = useSettingsStore((state) => state.startOfWeek); // "sunday" | "monday"

  const fetchAllEvents = useCallback(() => {
    setLoading(true);

    calendarService
      .getParishEvents()
      .then((fetched) => {
        setEvents(fetched);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setError("Could not load events.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Fetch-on-mount sets state once the request settles. Reworking how the data
    // hooks fetch is tracked separately, so the rule is silenced here for now.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllEvents();
  }, [fetchAllEvents]);

  const groupedEvents = useMemo(() => {
    return groupEventsByDay(events, startOfWeek);
  }, [events, startOfWeek]);

  return {
    events,
    groupedEvents,
    loading,
    error,
    refetch: fetchAllEvents,
  };
};
