import {
  CALENDAR_SOURCES,
  CALENDAR_SOURCE_NAMES,
} from "@/domain/calendarSources";
import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
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

  it("marks each calendar with the diamond in its colour", async () => {
    const { getAllByTestId } = await render(
      <CalendarLegend theme={Colours.light} />,
    );

    const colours = getAllByTestId("calendar-marker", {
      includeHiddenElements: true,
    }).map((marker) => StyleSheet.flatten(marker.props.style).backgroundColor);
    expect(colours).toEqual(
      CALENDAR_SOURCES.map((calendar) => calendar.colour),
    );
  });

  it("sets the heading, hint and names in the sans", async () => {
    const { getByText } = await render(<CalendarLegend theme={Colours.light} />);

    expect(getByText("Calendars")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 19,
      fontWeight: "700",
    });
    expect(getByText(/coloured diamond beside each event/)).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 17,
    });
    expect(getByText("Church")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 19,
    });
  });

  it("has a heading that explains the colours", async () => {
    const { getByRole, getByText } = await render(
      <CalendarLegend theme={Colours.light} />,
    );

    expect(getByRole("header", { name: "Calendars" })).toBeTruthy();
    expect(getByText(/coloured diamond beside each event/)).toBeTruthy();
  });
});
