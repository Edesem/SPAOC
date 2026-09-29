import { now } from "@/domain/parishTime";
import { calendarService } from "@/services/calendar";
import { toTitleCase } from "@/utils/toTitleCase";
import { useCallback, useEffect, useState } from "react";

export const useFastDay = () => {
  const [events, setEvents] = useState<string[]>([]);
  const [fastLoading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const fastingEvents = await calendarService.getFastingEvents();

      const today = now();

      // Filter for fasting events on today's date
      const todayFastingEvents = fastingEvents.filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        return (
          today.getTime() < eventEnd.getTime() &&
          today.getTime() >= eventStart.getTime() &&
          [
            "strict fast",
            "fast",
            "meat fast",
            "great lent",
            "the theotokos fast",
            "nativity fast",
            "the apostles' fast",
          ].includes(event.title.toLowerCase())
        );
      });

      const fastDay: string[] = [];

      todayFastingEvents.forEach((event) => {
        fastDay.push(toTitleCase(event.title));
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
