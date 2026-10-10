import { Colours } from "@/theme/colours";
import { getCommonStyles } from "@/theme/commonStyles";
import { fontFamily } from "@/theme/typography";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
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

  it("insets the heading and the verse 20pt, in line with the other headings", async () => {
    const { getByText } = await renderSection();

    expect(getByText("Giving")).toHaveStyle({ marginHorizontal: 20 });
    expect(getByText(/For where your treasure is/)).toHaveStyle({
      marginHorizontal: 20,
    });
  });

  it("sets the scripture verse like the other subtitles: upright sans at 19", async () => {
    const { getByText } = await renderSection();

    const verse = StyleSheet.flatten(
      getByText(/For where your treasure is/).props.style,
    );
    expect(verse).toMatchObject({
      fontFamily: fontFamily.sans,
      fontSize: 19,
      textAlign: "left",
    });
    expect(verse.fontStyle).toBeUndefined();
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

describe("DonateSection cards", () => {
  it.each(["square-card", "bank-card"])(
    "draws the %s like a row card: 8pt corners, a 16pt inset and the same shadow",
    async (testID) => {
      await renderSection();

      expect(screen.getByTestId(testID)).toHaveStyle({
        backgroundColor: Colours.light.itemBackground,
        borderRadius: 8,
        marginHorizontal: 16,
        elevation: 2,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      });
    },
  );

  it("shapes Donate via Square like Prayer's retry button: a 48pt pill", async () => {
    await renderSection();

    expect(screen.getByRole("link", { name: "Donate via Square" })).toHaveStyle(
      { minHeight: 48, borderRadius: 24, justifyContent: "center" },
    );
  });

  it("shapes Copy All the same way", async () => {
    await renderSection();

    expect(screen.getByRole("button", { name: "Copy All" })).toHaveStyle({
      minHeight: 48,
      borderRadius: 24,
      justifyContent: "center",
    });
  });
});
