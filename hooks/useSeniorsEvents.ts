import { API_KEY, SENIORS_EVENTS_BASE_URL, YOUTH_EVENTS_BASE_URL } from '@/constants/consts';
import { EventData } from '@/global';
import { groupEventsByDay } from '@/utils/dateUtils';
import { useState, useEffect } from 'react';

export const useSeniorsEvents = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seniorsEvents, setGroupedEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${SENIORS_EVENTS_BASE_URL}?key=${API_KEY}&timeMin=${new Date().toISOString()}&singleEvents=true&orderBy=startTime`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        const formattedEvents = data.items.map((item: any) => ({
          id: item.id,
          title: item.summary || 'No Title',
          start: item.start.dateTime || item.start.date,
          end: item.end?.dateTime || item.end?.date || '',
          description: item.description,
          location: item.location,
          source: 'seniors',
        }));

        const grouped = groupEventsByDay(formattedEvents).filter((section) => section.data.length > 0);
        setGroupedEvents(grouped);
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, seniorsEvents, loading };
};
