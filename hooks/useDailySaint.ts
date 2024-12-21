import { useState, useEffect } from 'react';
import dailySaints from '../assets/dailySaints.json';

export const useDailySaint = () => {
  const [todaysSaints, setTodaySaints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB'); // Format to "DD/MM/YYYY"

    // Filter saints data to get the saints for today's date
    const saintsForToday = dailySaints.filter((saint) => saint.Date === formattedDate);

    if (saintsForToday.length > 0) {
      const saintsList = saintsForToday.map((saint) => saint.Saint);
      setTodaySaints(saintsList);
    } else {
      setError('No saints found for today.');
    }
  }, []);

  return { todaysSaints, error };
};
