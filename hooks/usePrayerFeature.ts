import type { LiturgicalData } from "@/services/liturgical";
import { liturgicalService } from "@/services/liturgical";
import { useCallback, useEffect, useRef, useState } from "react";

// Coordinates the Prayer screen's data: the selected date, the liturgical day
// and services for it, and their loading/refresh/error behaviour. The screen
// itself just renders whatever this returns.
//
// `error` means the load failed. A day with no services is not an error; it
// comes back as `data` with an empty `services` list, and the screen decides
// how to word that.
export const usePrayerFeature = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [data, setData] = useState<LiturgicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Only the most recent request may write results, so a slow response for a
  // date the user has since moved on from can't overwrite the current one.
  const latestRequest = useRef(0);
  const selectedDateRef = useRef(selectedDate);

  const fetchDate = useCallback(async (date: Date) => {
    const request = ++latestRequest.current;
    try {
      const result = await liturgicalService.getLiturgicalData(date);
      if (request !== latestRequest.current) return;
      setData(result);
      setError(null);
    } catch (err) {
      if (request !== latestRequest.current) return;
      setData(null);
      setError(err as Error);
    }
  }, []);

  const load = useCallback(
    async (date: Date) => {
      selectedDateRef.current = date;
      setSelectedDate(date);
      setLoading(true);
      setError(null);
      setData(null);
      const request = latestRequest.current + 1;
      await fetchDate(date);
      if (request === latestRequest.current) setLoading(false);
    },
    [fetchDate],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDate(selectedDateRef.current);
    setRefreshing(false);
  }, [fetchDate]);

  useEffect(() => {
    load(selectedDateRef.current);
  }, [load]);

  return { selectedDate, loading, refreshing, error, data, load, refresh };
};
