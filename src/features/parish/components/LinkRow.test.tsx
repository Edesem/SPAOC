import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import LinkRow from "./LinkRow";

let mockScheme: "light" | "dark" = "light";

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => mockScheme,
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

describe("LinkRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScheme = "light";
  });

  it("is a card like the Prayer rows, with its label set as a card title", async () => {
    await render(
      <LinkRow icon="public" label="Visit our Website" onPress={jest.fn()} />,
    );

    expect(screen.getByRole("link")).toHaveStyle({
      backgroundColor: Colours.light.itemBackground,
      borderRadius: 8,
    });
    expect(screen.getByText("Visit our Website")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 19,
      color: Colours.light.moreImportantText,
    });
  });

  it.each([
    ["material", "public"],
    ["fontawesome", "instagram"],
  ] as const)(
    "shows its %s icon in the brand colour: navy in light mode",
    async (iconSet, icon) => {
      await render(
        <LinkRow
          icon={icon}
          iconSet={iconSet}
          label="Row"
          onPress={jest.fn()}
        />,
      );

      expect(screen.getByTestId("link-row-icon")).toHaveStyle({
        color: Colours.light.primary,
      });
    },
  );

  it("shows its icon in the bronze in dark mode", async () => {
    mockScheme = "dark";

    await render(<LinkRow icon="public" label="Row" onPress={jest.fn()} />);

    expect(screen.getByTestId("link-row-icon")).toHaveStyle({
      color: Colours.dark.primary,
    });
  });

  it("is a link ending in an external-link icon when it leaves the app", async () => {
    await render(<LinkRow icon="public" label="Row" onPress={jest.fn()} />);

    expect(screen.getByRole("link", { name: "Row" })).toBeTruthy();
    expect(screen.getByTestId("link-row-external")).toBeTruthy();
    expect(screen.queryByTestId("link-row-chevron")).toBeNull();
  });

  it("is a button ending in a chevron when it opens a screen in the app", async () => {
    await render(
      <LinkRow icon="settings" label="Settings" onPress={jest.fn()} chevron />,
    );

    expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();
    expect(screen.getByTestId("link-row-chevron")).toBeTruthy();
    expect(screen.queryByTestId("link-row-external")).toBeNull();
  });

  it("buzzes once and calls onPress when tapped", async () => {
    const onPress = jest.fn();
    await render(<LinkRow icon="public" label="Row" onPress={onPress} />);

    await fireEvent.press(screen.getByText("Row"));

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
