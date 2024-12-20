type EventData = {
    id: string;
    title: string;
    start: string;
    end: string;
    description: string;
    location: string;
};

type ItemProps = {
    item: EventData;
    onPress: () => void;
};

export { EventData, ItemProps };
