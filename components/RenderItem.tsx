import { EventData } from "@/types/global"
import { EventItem } from "./EventItem";

export const renderItem = ({ item }: { item: EventData }) => (
  <EventItem item= { item } onPress = {() => null} />
  );
