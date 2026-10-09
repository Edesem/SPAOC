import { fireEvent, render, screen } from "@testing-library/react-native";
import { fontFamily, typography } from "@/theme/typography";
import DropCapText from "./DropCapText";

const text = "In the beginning was the Word";

const layout = (...lines: string[]) =>
  fireEvent(screen.getByTestId("drop-cap-measure"), "textLayout", {
    nativeEvent: { lines: lines.map((line) => ({ text: line })) },
  });

describe("DropCapText", () => {
  it("sets the first letter large in the serif, apart from the rest", async () => {
    await render(<DropCapText text={text} textStyle={typography.reading} />);

    expect(screen.getByTestId("drop-cap")).toHaveTextContent("I");
    expect(screen.getByTestId("drop-cap")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontSize: typography.dropCap.fontSize,
    });
    expect(screen.getByText("n the beginning was the Word")).toBeTruthy();
  });

  it("colours the letter and the text separately", async () => {
    await render(
      <DropCapText
        text={text}
        textStyle={typography.reading}
        capColour="#B00020"
        textColour="#111111"
      />,
    );

    expect(screen.getByTestId("drop-cap")).toHaveStyle({ color: "#B00020" });
    expect(screen.getByText("n the beginning was the Word")).toHaveStyle({
      color: "#111111",
    });
  });

  it("keeps only the first two lines beside the letter and wraps the rest below", async () => {
    await render(<DropCapText text={text} textStyle={typography.reading} />);

    await layout("n the ", "beginning ", "was the ", "Word");

    expect(screen.getByTestId("drop-cap-head")).toHaveTextContent(
      "n the beginning",
    );
    expect(screen.getByTestId("drop-cap-tail")).toHaveTextContent(
      "was the Word",
    );
  });

  it("has no tail when the text fits beside the letter", async () => {
    await render(<DropCapText text={text} textStyle={typography.reading} />);

    await layout("n the beginning ", "was the Word");

    expect(screen.queryByTestId("drop-cap-tail")).toBeNull();
    expect(screen.getByTestId("drop-cap-head")).toHaveTextContent(
      "n the beginning was the Word",
    );
  });

  it("reads as one piece of text to a screen reader", async () => {
    await render(<DropCapText text={text} textStyle={typography.reading} />);

    expect(screen.getByLabelText(text)).toBeTruthy();
  });

  it("renders nothing for empty text", async () => {
    await render(<DropCapText text="" textStyle={typography.reading} />);

    expect(screen.queryByTestId("drop-cap")).toBeNull();
  });
});
