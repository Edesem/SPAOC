import { calendarService } from "../services";
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
    // Fetch-on-mount sets state once the request settles. Reworking how the data
    // hooks fetch is tracked separately, so the rule is silenced here for now.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSaintsForToday();
  }, [fetchSaintsForToday]);

  return { todaysSaints, error, refetchSaints: fetchSaintsForToday };
};
