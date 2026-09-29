import { useDailySaint } from "@/hooks/useDailySaint";
import { useEvents } from "@/hooks/useEvents";
import { useFastDay } from "@/hooks/useFastDay";
import {
  requestNotificationPermissions,
  setupNotificationListeners,
} from "@/notifications";
import { scheduleSaintNotificationsForNext7Days } from "@/utils/notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

// Background refresh only kicks in once the app has been away this long.
const BACKGROUND_REFRESH_THRESHOLD_MINUTES = 300;

const getMajorFastLabel = (fastEvents: string[]): string | null => {
  if (fastEvents.includes("Great Lent")) {
    return "Great Lent";
  }
  if (fastEvents.includes("The Apostles' Fast")) {
    return "The Apostles' Fast";
  }
  if (fastEvents.includes("The Theotokos Fast")) {
    return "Theotokos Fast";
  }
  if (fastEvents.includes("The Nativity Fast")) {
    return "The Nativity Fast";
  }
  return null;
};

const getMinorFastLabel = (fastEvents: string[]): string => {
  if (fastEvents.includes("Strict Fast")) {
    return "Abstain from meat, fish, dairy, eggs, wine, olive oil";
  }
  if (fastEvents.includes("Fast")) {
    return "Abstain from meat, dairy, eggs";
  }
  if (fastEvents.includes("Meat Fast")) {
    return "Abstain from meat";
  }
  return "No Fast";
};

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

  useFocusEffect(
    useCallback(() => {
      refetchEvents(); // this will reload event data and favourite status
    }, [refetchEvents]),
  );

  const filteredSections = useMemo(() => {
    // Initial screen behaviour: show every event section.
    if (!selectedMonth) {
      return groupedEvents;
    }

    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();

    return groupedEvents
      .map((section) => ({
        ...section,
        data: section.data.filter((item) => {
          const itemDate = new Date(item.start);
          return (
            itemDate.getFullYear() === year && itemDate.getMonth() === month
          );
        }),
      }))
      .filter((section) => section.data.length > 0);
  }, [groupedEvents, selectedMonth]);

  const sectionsWithIndex = useMemo(
    () =>
      filteredSections.map((section, index) => ({
        ...section,
        sectionIndex: index,
      })),
    [filteredSections],
  );

  const sections = useMemo(
    () => [
      {
        title: "Top Image",
        data: [],
      },
      {
        title: "Saint of the Day",
        data: [],
      },
      ...sectionsWithIndex,
      {
        title: "Bottom Image",
        data: [],
      },
    ],
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

  const todaysSaintsTitle =
    todaysSaints.length > 1 ? "Today's Feasts" : "Today's Feast:";

  return {
    todaysSaints,
    todaysSaintsTitle,
    fastLoading,
    majorFastLabel: getMajorFastLabel(fastEvents),
    minorFastLabel: getMinorFastLabel(fastEvents),
    sections,
    refreshing,
    onRefresh,
    selectedDate,
    showMonthPicker,
    setShowMonthPicker,
    onValueChange,
  };
};
