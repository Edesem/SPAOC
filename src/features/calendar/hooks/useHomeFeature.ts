import { now } from "@/lib/parishTime";
import { formatMonthHeading } from "../domain/dateUtils";
import { getMajorLabel, getMinorLabel } from "../domain/fasting";
import { useDailySaint } from "./useDailySaint";
import { useEvents } from "./useEvents";
import { useFastDay } from "./useFastDay";
import { useForegroundRefresh } from "@/hooks/useForegroundRefresh";
import {
  addSectionIndexes,
  filterSectionsByMonth,
  getLoadErrorMessage,
  getSaintsTitle,
} from "../domain/homeRules";
import { useCallback, useMemo, useState } from "react";

// Background refresh only kicks in once the app has been away this long.
const BACKGROUND_REFRESH_THRESHOLD_MS = 300 * 60 * 1000;

// Coordinates the Home screen's data: events, the daily saint, and the fast
// day, plus their loading/refresh/error behaviour. The screen itself just
// renders whatever this returns.
export const useHomeFeature = () => {
  const { todaysSaints, error: saintsError, refetchSaints } = useDailySaint();
  const {
    groupedEvents,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents();
  const {
    events: fastEvents,
    fastLoading,
    error: fastError,
    refetch: refetchFast,
  } = useFastDay();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(now);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSaints(), refetchFast(), refetchEvents()]);
    setRefreshing(false);
  }, [refetchSaints, refetchFast, refetchEvents]);

  useForegroundRefresh(BACKGROUND_REFRESH_THRESHOLD_MS, onRefresh);

  const filteredSections = useMemo(
    () => filterSectionsByMonth(groupedEvents, selectedMonth),
    [groupedEvents, selectedMonth],
  );

  const sections = useMemo(
    () => addSectionIndexes(filteredSections),
    [filteredSections],
  );

  const onValueChange = useCallback(
    (event: string, newDate: Date) => {
      if (event === "dateSetAction") {
        const pickedDate = newDate || selectedDate;
        setSelectedDate(pickedDate);
        setSelectedMonth(pickedDate);
      }

      setShowMonthPicker(false);
    },
    [selectedDate],
  );

  const clearMonthFilter = useCallback(() => {
    setSelectedMonth(null);
    setSelectedDate(now());
  }, []);

  const todaysSaintsTitle = getSaintsTitle(todaysSaints);

  const loadErrorMessage = getLoadErrorMessage({
    events: eventsError,
    saints: saintsError,
    fast: fastError,
  });

  return {
    todaysSaints,
    todaysSaintsTitle,
    fastLoading,
    loadErrorMessage,
    majorFastLabel: getMajorLabel(fastEvents),
    minorFastLabel: getMinorLabel(fastEvents),
    sections,
    refreshing,
    onRefresh,
    selectedDate,
    isMonthFiltered: selectedMonth !== null,
    monthFilterLabel: selectedMonth ? formatMonthHeading(selectedMonth) : null,
    clearMonthFilter,
    showMonthPicker,
    setShowMonthPicker,
    onValueChange,
  };
};
