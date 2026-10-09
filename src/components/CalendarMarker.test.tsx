import { render } from "@testing-library/react-native";
import { StyleSheet, processColor } from "react-native";
import CalendarMarker from "./CalendarMarker";

// The marker is hidden from screen readers, so queries must include hidden elements.
const HIDDEN = { includeHiddenElements: true };

const renderMarker = (props: {
  colour: string;
  height?: number;
  aspect?: number;
}) => render(<CalendarMarker {...props} />);

describe("CalendarMarker", () => {
  it("is a diamond in the given colour", async () => {
    const { getByTestId } = await renderMarker({ colour: "#B8860B" });

    const shape = getByTestId("calendar-marker-shape", HIDDEN);
    expect(shape.props.fill.payload).toBe(processColor("#B8860B"));
  });

  it("puts a point at the middle of each side of its box", async () => {
    const { getByTestId } = await renderMarker({
      colour: "#000000",
      height: 20,
      aspect: 0.5,
    });

    // Top, right, bottom, left.
    expect(getByTestId("calendar-marker-shape", HIDDEN).props.d).toBe(
      "M5 0 10 10 5 20 0 10z",
    );
  });

  it("is squeezed sideways, so it is taller than it is wide", async () => {
    const { getByTestId } = await renderMarker({
      colour: "#000000",
      height: 20,
      aspect: 0.5,
    });

    const box = StyleSheet.flatten(
      getByTestId("calendar-marker", HIDDEN).props.style,
    );
    expect(box.height).toBe(20);
    expect(box.width).toBe(10);
  });

  it("is lanky by default", async () => {
    const { getByTestId } = await renderMarker({ colour: "#000000" });

    const box = StyleSheet.flatten(
      getByTestId("calendar-marker", HIDDEN).props.style,
    );
    expect(box.width).toBeLessThan(box.height);
  });

  it("is hidden from screen readers, since a name always sits beside it", async () => {
    const { getByTestId } = await renderMarker({ colour: "#000000" });

    const box = getByTestId("calendar-marker", HIDDEN);
    expect(box.props.accessibilityElementsHidden).toBe(true);
    expect(box.props.importantForAccessibility).toBe("no-hide-descendants");
  });
});
