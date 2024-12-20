import { EventData } from "@/global"
import { EventItem } from "./EventItem";

export const renderItem = ({ item }: { item: EventData }) => (
  <EventItem item= { item } onPress = {() => console.log(`${item.title} tapped`)} />
  );
