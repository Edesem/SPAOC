import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import CalendarMarker from "./CalendarMarker";

// The marker is hidden from screen readers, so queries must include hidden elements.
const HIDDEN = { includeHiddenElements: true };

const shapeStyle = async (props: { colour: string; size?: number }) => {
  const { getByTestId } = await render(<CalendarMarker {...props} />);
  return StyleSheet.flatten(getByTestId("calendar-marker", HIDDEN).props.style);
};

describe("CalendarMarker", () => {
  it("is a square turned 45 degrees onto its point, in the given colour", async () => {
    const style = await shapeStyle({ colour: "#B8860B" });

    expect(style.backgroundColor).toBe("#B8860B");
    expect(style.width).toBe(style.height);
    expect(style.transform).toContainEqual({ rotate: "45deg" });
  });

  it("is squeezed sideways, so it is taller than it is wide", async () => {
    const { getByTestId } = await render(
      <CalendarMarker colour="#000000" height={20} aspect={0.5} />,
    );

    const shape = StyleSheet.flatten(
      getByTestId("calendar-marker", HIDDEN).props.style,
    );
    const box = StyleSheet.flatten(
      getByTestId("calendar-marker", HIDDEN).parent?.props.style,
    );
    expect(shape.transform).toContainEqual({ scaleX: 0.5 });
    expect(box.height).toBe(20);
    expect(box.width).toBe(10);
  });

  it("is lanky by default", async () => {
    const { getByTestId } = await render(<CalendarMarker colour="#000000" />);

    const box = StyleSheet.flatten(
      getByTestId("calendar-marker", HIDDEN).parent?.props.style,
    );
    expect(box.width).toBeLessThan(box.height);
  });

  it("is hidden from screen readers, since a name always sits beside it", async () => {
    const { getByTestId } = await render(<CalendarMarker colour="#000000" />);

    const outer = getByTestId("calendar-marker", HIDDEN).parent;
    expect(outer?.props.accessibilityElementsHidden).toBe(true);
    expect(outer?.props.importantForAccessibility).toBe("no-hide-descendants");
  });
});
