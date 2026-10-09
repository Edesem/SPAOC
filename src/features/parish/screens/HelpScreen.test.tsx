import HelpScreen from "./HelpScreen";
import { fontFamily } from "@/theme/typography";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-GB" }],
}));
jest.mock("../components/DonateSection", () => () => null);
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("HelpScreen", () => {
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterEach(() => {
    openURL.mockRestore();
  });

  const openedMail = () => {
    const url = new URL(openURL.mock.calls[0][0]);
    return {
      subject: url.searchParams.get("subject"),
      body: url.searchParams.get("body")!,
    };
  };

  it("sets link labels in the sans at 500", async () => {
    await render(<HelpScreen />);

    expect(screen.getByText("Report a bug")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontWeight: "500",
    });
  });

  it("left-aligns the subtitle, in line with the header title", async () => {
    await render(<HelpScreen />);

    expect(screen.getByText(/Need help using the app\?/)).toHaveStyle({
      textAlign: "left",
    });
  });

  it.each([
    ["Report a bug", "Bug", "Please describe the issue you encountered below:"],
    [
      "Suggest a feature",
      "Suggestion",
      "Thank you for using SPAOC! We’d love to hear your idea or improvement suggestion:",
    ],
    ["Contact Support", "Support", "Let us know how we can help:"],
  ])(
    "opens a %s email that opens with its own message",
    async (label, type, message) => {
      await render(<HelpScreen />);

      await fireEvent.press(screen.getByText(label));

      const { subject, body } = openedMail();
      expect(subject).toBe(`[${type}] (INSERT TITLE)`);
      expect(body.startsWith(`${message}\n\n`)).toBe(true);
    },
  );
});
