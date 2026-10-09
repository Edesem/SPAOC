import { render } from "@testing-library/react-native";
import { processColor } from "react-native";
import OrnamentalDivider from "./OrnamentalDivider";

// The divider is hidden from screen readers, so queries must include hidden elements.
const HIDDEN = { includeHiddenElements: true };

describe("OrnamentalDivider", () => {
  it("draws a rule either side of the mark, in the given colour", async () => {
    const { getAllByTestId } = await render(
      <OrnamentalDivider colour="#a88646" />,
    );

    const rules = getAllByTestId("ornamental-divider-rule", HIDDEN);
    expect(rules).toHaveLength(2);
    rules.forEach((rule) =>
      expect(rule).toHaveStyle({ backgroundColor: "#a88646", height: 1 }),
    );
  });

  it("fills the mark with the given colour", async () => {
    const { getByTestId } = await render(
      <OrnamentalDivider colour="#a88646" />,
    );

    const mark = getByTestId("ornamental-divider-mark", HIDDEN);
    expect(mark.props.fill.payload).toBe(processColor("#a88646"));
  });

  it("makes the mark an even-sided lozenge, unlike the tall calendar diamond", async () => {
    const { getByTestId } = await render(
      <OrnamentalDivider colour="#000000" />,
    );

    // Top, right, bottom, left.
    expect(getByTestId("ornamental-divider-mark", HIDDEN).props.d).toBe(
      "M4 0 8 4 4 8 0 4z",
    );
  });

  it("takes its margins from the caller", async () => {
    const { getByTestId } = await render(
      <OrnamentalDivider colour="#000000" style={{ marginHorizontal: 16 }} />,
    );

    expect(getByTestId("ornamental-divider", HIDDEN)).toHaveStyle({
      marginHorizontal: 16,
    });
  });

  it("is hidden from screen readers, since it is decoration", async () => {
    const { getByTestId } = await render(
      <OrnamentalDivider colour="#000000" />,
    );

    const row = getByTestId("ornamental-divider", HIDDEN);
    expect(row.props.accessibilityElementsHidden).toBe(true);
    expect(row.props.importantForAccessibility).toBe("no-hide-descendants");
  });
});
