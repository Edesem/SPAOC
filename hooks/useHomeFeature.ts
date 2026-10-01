import { getMajorLabel, getMinorLabel } from "@/domain/fasting";
import { useDailySaint } from "@/hooks/useDailySaint";
import { useEvents } from "@/hooks/useEvents";
import { useFastDay } from "@/hooks/useFastDay";
import {
  requestNotificationPermissions,
  setupNotificationListeners,
} from "@/notifications";
import {
  addSectionIndexes,
  buildHomeSections,
  filterSectionsByMonth,
  getSaintsTitle,
} from "@/utils/homeRules";
import { scheduleSaintNotificationsForNext7Days } from "@/utils/notifications";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

// Background refresh only kicks in once the app has been away this long.
const BACKGROUND_REFRESH_THRESHOLD_MINUTES = 300;

// Coordinates the Home screen's data: events, the daily saint, and the fast
// day, plus their loading/refresh/error behaviour. The screen itself just
// renders whatever this returns.
export const useHomeFeature = () => {
  const appState = useRef(AppState.currentState);
  const lastRefreshTime = useRef<number | null>(null);

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

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          const now = Date.now();
          if (lastRefreshTime.current === null) {
            lastRefreshTime.current = now;
          }
          const minutesSinceLastRefresh =
            (now - lastRefreshTime.current) / (1000 * 60);

          if (minutesSinceLastRefresh > BACKGROUND_REFRESH_THRESHOLD_MINUTES) {
            onRefresh();
            lastRefreshTime.current = now;
          }
        }

        appState.current = nextAppState;
      },
    );

    requestNotificationPermissions();
    setupNotificationListeners();

    // Schedule saint notification
    scheduleSaintNotificationsForNext7Days();

    return () => subscription.remove();
  }, [onRefresh]);

  const filteredSections = useMemo(
    () => filterSectionsByMonth(groupedEvents, selectedMonth),
    [groupedEvents, selectedMonth],
  );

  const sectionsWithIndex = useMemo(
    () => addSectionIndexes(filteredSections),
    [filteredSections],
  );

  const sections = useMemo(
    () => buildHomeSections(sectionsWithIndex),
    [sectionsWithIndex],
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
    showMonthPicker,
    setShowMonthPicker,
    onValueChange,
  };
};
