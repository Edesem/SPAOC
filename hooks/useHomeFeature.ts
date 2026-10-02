import { getMajorLabel, getMinorLabel } from "@/domain/fasting";
import { useDailySaint } from "@/hooks/useDailySaint";
import { useEvents } from "@/hooks/useEvents";
import { useFastDay } from "@/hooks/useFastDay";
import { useForegroundRefresh } from "@/hooks/useForegroundRefresh";
import {
  addSectionIndexes,
  filterSectionsByMonth,
  getSaintsTitle,
} from "@/utils/homeRules";
import { useCallback, useMemo, useState } from "react";

// Background refresh only kicks in once the app has been away this long.
const BACKGROUND_REFRESH_THRESHOLD_MS = 300 * 60 * 1000;

// Coordinates the Home screen's data: events, the daily saint, and the fast
// day, plus their loading/refresh/error behaviour. The screen itself just
// renders whatever this returns.
export const useHomeFeature = () => {
  const { todaysSaints, refetchSaints } = useDailySaint();
  const { groupedEvents, refetch: refetchEvents } = useEvents();
  const {
    events: fastEvents,
    fastLoading,
    refetch: refetchFast,
  } = useFastDay();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
    setSelectedDate(new Date());
  }, []);

  const todaysSaintsTitle = getSaintsTitle(todaysSaints);

  return {
    todaysSaints,
    todaysSaintsTitle,
    fastLoading,
    majorFastLabel: getMajorLabel(fastEvents),
    minorFastLabel: getMinorLabel(fastEvents),
    sections,
    refreshing,
    onRefresh,
    selectedDate,
    isMonthFiltered: selectedMonth !== null,
    clearMonthFilter,
    showMonthPicker,
    setShowMonthPicker,
    onValueChange,
  };
};
