import { useState, useEffect } from 'react';
import { API_KEY, SAINTS_CALENDAR_ID } from '@/constants/consts';

export async function fetchSaintsForDate(date: Date): Promise<string[]> {
  const timeMin = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const timeMax = new Date(date.setHours(23, 59, 59, 999)).toISOString();

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${SAINTS_CALENDAR_ID}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&orderby=created&singleEvents=true`
    );

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    return data.items.map((event: any) => event.summary || 'Unnamed Saint');
  } catch (err) {
    console.error('Error fetching saints for', date.toDateString(), err);
    return [];
  }
}

export const useDailySaint = () => {
  const [todaysSaints, setTodaySaints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSaintsForToday = async () => {
    const saints = await fetchSaintsForDate(new Date());

    if (saints.length > 0) {
      setTodaySaints(saints);
      setError(null);
    } else {
      setTodaySaints([]);
      setError('No saints found for today.');
    }
  };

  useEffect(() => {
    fetchSaintsForToday();
  }, []);

  return { todaysSaints, error, refetchSaints: fetchSaintsForToday };
};
