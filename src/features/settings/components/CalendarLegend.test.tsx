import { CALENDAR_SOURCE_NAMES } from "@/domain/calendarSources";
import { Colours } from "@/theme/colours";
import { render } from "@testing-library/react-native";
import CalendarLegend from "./CalendarLegend";

describe("CalendarLegend", () => {
  it("names every calendar, in the Settings order", async () => {
    const { getAllByText } = await render(
      <CalendarLegend theme={Colours.light} />,
    );

    const labels = CALENDAR_SOURCE_NAMES.map(
      (name) => name.charAt(0).toUpperCase() + name.slice(1),
    );
    labels.forEach((label) => expect(getAllByText(label)).toHaveLength(1));
  });

  it("has a heading that explains the colours", async () => {
    const { getByRole, getByText } = await render(
      <CalendarLegend theme={Colours.light} />,
    );

    expect(getByRole("header", { name: "Calendars" })).toBeTruthy();
    expect(getByText(/colour beside each event/)).toBeTruthy();
  });
});
