type EventData = {
    data: never[];
    id: string;
    title: string;
    start: string;
    end: string;
    description: string;
    location: string;
    source: string;
};

type ItemProps = {
    item: EventData;
    onPress: () => void;
};

export { EventData, ItemProps };
