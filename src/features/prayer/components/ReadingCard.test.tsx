import { fireEvent, render, screen } from "@testing-library/react-native";
import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
import type { Reading } from "../services";
import ReadingCard from "./ReadingCard";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

// Ionicons loads a native font, which Jest can't.
jest.mock("react-native-vector-icons/Ionicons", () => () => null);

const gospel: Reading = {
  kind: "gospel",
  title: "MARK 2:1-12",
  teaser: "Faith &amp; works",
  fullText: "Mark full text",
};

describe("ReadingCard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the title in title case and the decoded teaser", async () => {
    await render(<ReadingCard reading={gospel} />);

    expect(screen.getByText("Mark 2:1-12")).toBeTruthy();
    expect(screen.getByTestId("drop-cap")).toHaveTextContent("F");
    expect(screen.getByText("aith & works")).toBeTruthy();
  });

  it("opens the reading in the daily readings screen when tapped", async () => {
    await render(<ReadingCard reading={gospel} />);

    await fireEvent.press(screen.getByText("aith & works"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/dailyReadings",
      params: {
        type: "gospel",
        reading: "Mark full text",
        title: "MARK 2:1-12",
      },
    });
  });

  it("draws a thick divider in the accent colour when given one", async () => {
    await render(<ReadingCard reading={gospel} accentColour="#D4AF37" />);

    expect(screen.getByTestId("reading-divider")).toHaveStyle({
      backgroundColor: "#D4AF37",
      height: 3,
    });
  });

  it("draws the plain divider without an accent colour", async () => {
    await render(<ReadingCard reading={gospel} />);

    expect(screen.getByTestId("reading-divider")).toHaveStyle({ height: 1 });
  });

  it("sets the title and teaser in the serif, the liturgical voice", async () => {
    await render(<ReadingCard reading={gospel} />);

    expect(screen.getByText("Mark 2:1-12")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
    expect(screen.getByText("aith & works")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "400",
    });
  });

  it("colours the drop cap with the commemorate red, whatever the accent", async () => {
    await render(<ReadingCard reading={gospel} accentColour="#D4AF37" />);

    expect(screen.getByTestId("drop-cap")).toHaveStyle({
      color: Colours.light.commemorate,
    });
  });
});
