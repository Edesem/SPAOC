import { API_KEY, FASTING_BASE_URL } from '@/constants/consts';
import { getCurrentDate } from '@/utils/dateUtils';
import { useState, useEffect } from 'react';

export const useFastDay = () => {
  const [events, setEvents] = useState<string[]>([]);
  const [fastLoading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await fetch(
        `${FASTING_BASE_URL}?key=${API_KEY}&timeMin=${new Date().toISOString()}&singleEvents=true&orderBy=startTime`
      );
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      const formattedEvents = data.items.map((item: any) => ({
        id: item.id,
        title: item.summary || 'No Title',
        start: item.start.dateTime || item.start.date,
        end: item.end?.dateTime || item.end?.date || '',
        description: item.description,
        location: item.location,
      }));

      const today = getCurrentDate();

      // Filter for fasting events on today's date
      const todayFastingEvents = formattedEvents.filter((event: any) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        return (
          today.getTime() < eventEnd.getTime() &&
          today.getTime() >= eventStart.getTime() &&
          [
            'Strict Fast',
            'Fast',
            'Meat Fast',
            'Great Lent',
            'The Theotokos Fast',
            'Nativity Fast',
            'The Apostles\' Fast'
          ].includes(event.title)
        );
      });

      const fastDay: string[] = [];

      todayFastingEvents.forEach((event: any) => {
        fastDay.push(event.title);
      });

      setEvents(fastDay);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return { events, fastLoading, refetch: fetchEvents };
};
