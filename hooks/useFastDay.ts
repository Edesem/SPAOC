import { classifyFastingEvent, type FastKind } from "@/domain/fasting";
import { now } from "@/domain/parishTime";
import { calendarService } from "@/services/calendar";
import { useCallback, useEffect, useState } from "react";

export const useFastDay = () => {
  const [events, setEvents] = useState<FastKind[]>([]);
  const [fastLoading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const fastingEvents = await calendarService.getFastingEvents();

      const today = now();

      // Classify the fasting events in effect today, dropping non-fasts
      const fastDay = fastingEvents.flatMap((event) => {
        const inEffect =
          today.getTime() < new Date(event.end).getTime() &&
          today.getTime() >= new Date(event.start).getTime();
        const kind = inEffect ? classifyFastingEvent(event.title) : null;
        return kind ? [kind] : [];
      });

      setEvents(fastDay);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, fastLoading, refetch: fetchEvents };
};
