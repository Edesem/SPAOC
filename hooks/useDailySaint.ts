import { calendarService } from "@/services/calendar";
import { useCallback, useEffect, useState } from "react";

export const useDailySaint = () => {
  const [todaysSaints, setTodaySaints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSaintsForToday = useCallback(async () => {
    const saints = await calendarService.getSaintsForDate(new Date());

    if (saints.length > 0) {
      setTodaySaints(saints);
      setError(null);
    } else {
      setTodaySaints([]);
      setError("No saints found for today.");
    }
  }, []);

  useEffect(() => {
    fetchSaintsForToday();
  }, [fetchSaintsForToday]);

  return { todaysSaints, error, refetchSaints: fetchSaintsForToday };
};
