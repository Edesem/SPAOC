import { useState, useEffect } from 'react';
import { API_KEY, SAINTS_CALENDAR_ID } from '@/constants/consts';
import { getCurrentDate } from '@/utils/dateUtils';

export const useDailySaint = () => {
  const [todaysSaints, setTodaySaints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSaintsForToday = async () => {
    const date = new Date()
      
    const timeMin = new Date((date).setHours(0, 0, 0, 0)).toISOString();
    const timeMax = new Date((date).setHours(23, 59, 59, 999)).toISOString();

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${SAINTS_CALENDAR_ID}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&orderby=created&singleEvents=true`
      );

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.items.length > 0) {
        setTodaySaints(data.items.map((event: any) => event.summary || 'Unnamed Saint'));
        setError(null); // Clear previous errors
      } else {
        setTodaySaints([]);
        setError('No saints found for today.');
      }
    } catch (err) {
      console.error('Error fetching saints:', err);
      setTodaySaints([]);
      setError('Failed to fetch saints data.');
    }
  };

  useEffect(() => {
    fetchSaintsForToday();
  }, []);

  return { todaysSaints, error, refetchSaints: fetchSaintsForToday };
};
