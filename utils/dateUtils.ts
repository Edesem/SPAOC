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
      // Parse the event start time into a Date object
      const eventDate = new Date(event.start);
  
      // Convert the event date to Australian local date string (YYYY-MM-DD format)
      const dayKey = eventDate.toLocaleDateString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD
  
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(event);
    });
  
    const today = new Date();
    const startOfThisWeek = getStartOfWeek(today);
    const startOfNextWeek = new Date(startOfThisWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    const startOfLater = new Date(startOfNextWeek); // One week after "Next Week"
    startOfLater.setDate(startOfLater.getDate() + 6); // Start of "Later" label
  
    let addedThisWeekLabel = false;
    let addedNextWeekLabel = false;
    let addedLaterLabel = false; // Flag for "Later" label
  
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
        } else if (date >= startOfNextWeek && date < startOfLater) {
          // Assign "Next Week" label only once
          if (!addedNextWeekLabel) {
            weekLabel = 'Next Week';
            addedNextWeekLabel = true;
          }
        } else if (date >= startOfLater) {
          // Assign "Later" label only once
          if (!addedLaterLabel) {
            weekLabel = 'Later';
            addedLaterLabel = true;
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
    const day = date.getDay(); // Make Sunday (0) the last day of the week
    date.setHours(0, 0, 0, 0); // Set time to midnight
    date.setDate(date.getDate() - day + 2); // Set the date to the start of the week (Monday)
    return date;
};

// Function to fetch current date in 'YYYY-MM-DD' format
export const getCurrentDate = (): Date => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000; // Convert offset to milliseconds
  return new Date(now.getTime() - offset); // Return Date object
};
