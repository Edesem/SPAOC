import { EventData } from "@/global";

export const formatDateHeading = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
  
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleDateString([], { day: 'numeric', month: 'long' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleDateString([], { day: 'numeric', month: 'long' })}`;
    } else {
      return `${date.toLocaleDateString([], { weekday: 'long' })}, ${date.toLocaleDateString([], { day: 'numeric', month: 'long' })}`;
    }
  };

export const groupEventsByDay = (events: EventData[]) => { 
    const grouped: { [key: string]: EventData[] } = {};

    events.forEach((event) => {
      const eventDate = new Date(event.start);
      const dayKey = eventDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(event);
    });
  
    const today = new Date();
    const startOfThisWeek = getStartOfWeek(today);
    const startOfNextWeek = new Date(startOfThisWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
  
    let addedThisWeekLabel = false;
    let addedNextWeekLabel = false;
  
    // Transform the grouped object into an array with formatted titles
    return Object.keys(grouped)
      .sort() // Sort by date
      .map((key) => {
        const date = new Date(key);
  
        // Determine the week label
        let weekLabel;
        if (date < startOfThisWeek) {
          weekLabel = undefined; // Events before the current week
        } else if (date >= startOfThisWeek && date < startOfNextWeek) {
          // Assign "This Week" label only once
          if (!addedThisWeekLabel) {
            weekLabel = 'This Week';
            addedThisWeekLabel = true;
          }
        } else if (date >= startOfNextWeek) {
          // Assign "Next Week" label only once
          if (!addedNextWeekLabel) {
            weekLabel = 'Next Week';
            addedNextWeekLabel = true;
          }
        }
  
        return {
          title: formatDateHeading(date),
          weekLabel,
          data: grouped[key],
        };
      })
      .filter((section) => section.data.length > 0); // Remove empty sections
};

export const getStartOfWeek = (date: Date) => { 
    const day = date.getDay() || 7; // Make Sunday (0) the last day of the week
    date.setHours(0, 0, 0, 0); // Set time to midnight
    date.setDate(date.getDate() - day + 1); // Set the date to the start of the week (Monday)
    return date;
};
