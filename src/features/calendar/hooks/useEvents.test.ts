import { useEvents } from "./useEvents";
import { calendarService } from "../services";
import { useSettingsStore } from "@/services/settings";
import { groupEventsByDay } from "../domain/dateUtils";
import { act, renderHook, waitFor } from "@testing-library/react-native";

jest.mock("../services", () => ({
  calendarService: { getParishEvents: jest.fn() },
}));

jest.mock("../domain/dateUtils", () => ({
  groupEventsByDay: jest.fn((events: unknown[]) => [
    { title: "Day", data: events },
  ]),
}));

const getParishEvents = calendarService.getParishEvents as jest.Mock;

const event = {
  id: "1",
  title: "Youth Night",
  start: "2026-08-13T09:00:00.000Z",
  end: "2026-08-13T11:00:00.000Z",
  description: "",
  location: "",
  source: "youth",
};

describe("useEvents", () => {
  beforeEach(() => {
    getParishEvents.mockReset();
    (groupEventsByDay as jest.Mock).mockClear();
    useSettingsStore.setState({ startOfWeek: "monday" });
  });

  it("loads parish events from the calendar service", async () => {
    getParishEvents.mockResolvedValue([event]);

    const { result } = await renderHook(() => useEvents());

    await waitFor(() => expect(result.current.events).toEqual([event]));
    expect(result.current.loading).toBe(false);
    expect(result.current.groupedEvents).toEqual([
      { title: "Day", data: [event] },
    ]);
  });

  it("refetches on demand", async () => {
    getParishEvents.mockResolvedValue([]);
    const { result } = await renderHook(() => useEvents());
    await waitFor(() => expect(getParishEvents).toHaveBeenCalledTimes(1));

    getParishEvents.mockResolvedValue([event]);
    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.events).toEqual([event]));
    expect(getParishEvents).toHaveBeenCalledTimes(2);
  });

  it("keeps an empty list when the service fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getParishEvents.mockRejectedValue(new Error("Network error"));

    const { result } = await renderHook(() => useEvents());

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(result.current.events).toEqual([]);
    expect(result.current.loading).toBe(false);
    consoleErrorSpy.mockRestore();
  });

  it("regroups events when the start of week changes", async () => {
    getParishEvents.mockResolvedValue([event]);
    await renderHook(() => useEvents());
    await waitFor(() =>
      expect(groupEventsByDay).toHaveBeenLastCalledWith([event], "monday"),
    );

    await act(async () => {
      useSettingsStore.getState().setStartOfWeek("sunday");
    });

    expect(groupEventsByDay).toHaveBeenLastCalledWith([event], "sunday");
  });
});
