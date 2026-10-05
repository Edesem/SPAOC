import { now } from "@/lib/parishTime";
import { calendarService } from "../services";
import { useCallback, useEffect, useState } from "react";

export const useDailySaint = () => {
  const [todaysSaints, setTodaySaints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // A failed request sets an error; a day without saints does not.
  const fetchSaintsForToday = useCallback(async () => {
    try {
      setTodaySaints(await calendarService.getSaintsForDateOrThrow(now()));
      setError(null);
    } catch (error) {
      console.error("Error fetching saints:", error);
      setError("Could not load today's saints.");
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
