import { API_KEY, FASTING_BASE_URL } from '@/constants/consts';
import { EventData } from '@/global';
import { useState, useEffect } from 'react';

export const useFastDay = () => {
  const [events, setEvents] = useState<string[]>([]);
  const [fastLoading, setLoading] = useState(true);

  useEffect(() => {
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

        const today = new Date().toISOString().split('T')[0];

        // Filter for fasting events on today's date
        const todayFastingEvents = formattedEvents.filter((event: EventData) => {
          const eventStart = new Date(event.start).toISOString().split('T')[0];
          const eventEnd = new Date(event.end).toISOString().split('T')[0];

          return (
            today < eventEnd &&
            today >= eventStart &&
            [
              'Strict Fast',
              'Fast',
              'Meat Fast',
              'Great Lent',
              'The Theotokos Fast',
              'Nativity Fast',
            ].includes(event.title)
          );
        });
        
        const fastDay: string[] = [];

        todayFastingEvents.forEach((event: EventData) => {
          fastDay.push(event.title);
        });

        setEvents(fastDay);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return events;
};
