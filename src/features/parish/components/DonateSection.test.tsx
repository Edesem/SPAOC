import { Colours } from "@/theme/colours";
import { getCommonStyles } from "@/theme/commonStyles";
import { fontFamily } from "@/theme/typography";
import { render } from "@testing-library/react-native";
import DonateSection from "./DonateSection";

jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
jest.mock("expo-router", () => ({ useFocusEffect: jest.fn() }));
jest.mock("react-native-toast-message", () => ({ show: jest.fn() }));
jest.mock("@/components/ui/IconSymbol", () => ({ IconSymbol: () => null }));

const renderSection = () =>
  render(
    <DonateSection
      theme={Colours.light}
      CommonStyles={getCommonStyles("light")}
    />,
  );

describe("DonateSection typography", () => {
  it("sets the heading in the serif like the other screen titles", async () => {
    const { getByText } = await renderSection();

    expect(getByText("Giving")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
  });

  it("sets the scripture verse in the serif italic", async () => {
    const { getByText } = await renderSection();

    expect(getByText(/For where your treasure is/)).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontStyle: "italic",
    });
  });

  it("sets card titles and the Square button in the sans at 700", async () => {
    const { getByText } = await renderSection();

    expect(getByText("Support Us Online")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontWeight: "700",
    });
    expect(getByText("Donate via Square")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontWeight: "700",
    });
  });
});
