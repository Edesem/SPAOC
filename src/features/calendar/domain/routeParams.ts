import { EventDetailsParams } from "@/types/routes";
import { EventData } from "../types";

export const toEventDetailsParams = (event: EventData): EventDetailsParams => ({
  id: event.id,
  title: event.title,
  start: event.start,
  end: event.end,
  allDay: event.allDay ? "true" : "false",
  description: event.description,
  location: event.location,
  source: event.source,
});

export const parseEventDetailsParams = (params: EventDetailsParams) => ({
  ...params,
  allDay: params.allDay === "true",
});
