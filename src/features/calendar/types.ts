import type { EventSourceName } from "@/domain/calendarSources";

type EventData = {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    description: string;
    location: string;
    source: EventSourceName;
};

type ItemProps = {
    item: EventData;
    onPress: () => void;
};

export { EventData, ItemProps };
