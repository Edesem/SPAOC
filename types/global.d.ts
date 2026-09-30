type EventData = {
    data: never[];
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    description: string;
    location: string;
    source: string;
};

type ItemProps = {
    item: EventData;
    onPress: () => void;
};

export { EventData, ItemProps };
