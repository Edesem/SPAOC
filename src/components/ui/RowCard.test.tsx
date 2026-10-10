import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text } from "react-native";
import RowCard from "./RowCard";

let mockScheme: "light" | "dark" = "light";

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => mockScheme,
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

describe("RowCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScheme = "light";
  });

  it("sets the title like an event row's title and the subtitle like its time", async () => {
    await render(
      <RowCard title="Vespers" subtitle="Evening" onPress={jest.fn()} />,
    );

    expect(screen.getByText("Vespers")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 19,
      color: Colours.light.moreImportantText,
    });
    const subtitle = StyleSheet.flatten(
      screen.getByText("Evening").props.style,
    );
    expect(subtitle).toMatchObject({
      fontFamily: fontFamily.sans,
      fontSize: 15,
      color: Colours.light.lessImportantText,
    });
    expect(subtitle.fontStyle).toBeUndefined();
  });

  it("is a card with the event rows' fill, 8pt corners and 16pt inset", async () => {
    await render(<RowCard title="Vespers" onPress={jest.fn()} />);

    expect(screen.getByRole("button")).toHaveStyle({
      backgroundColor: Colours.light.itemBackground,
      borderRadius: 8,
      marginHorizontal: 16,
      minHeight: 48,
    });
  });

  it("takes the dark card fill in dark mode", async () => {
    mockScheme = "dark";

    await render(<RowCard title="Vespers" onPress={jest.fn()} />);

    expect(screen.getByRole("button")).toHaveStyle({
      backgroundColor: Colours.dark.itemBackground,
    });
  });

  it("shows the icon and the trailing accessory it is given", async () => {
    await render(
      <RowCard
        title="Vespers"
        icon={<Text>the icon</Text>}
        trailing={<Text>the trailing</Text>}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("the icon")).toBeTruthy();
    expect(screen.getByText("the trailing")).toBeTruthy();
  });

  it("is one button that a screen reader reads as the title and subtitle", async () => {
    await render(
      <RowCard title="Vespers" subtitle="Evening" onPress={jest.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Vespers, Evening" }),
    ).toBeTruthy();
  });

  it("is read as just the title when it has no subtitle", async () => {
    await render(<RowCard title="Vespers" onPress={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Vespers" })).toBeTruthy();
  });

  it("can be a link when it leaves the app", async () => {
    await render(
      <RowCard title="Website" accessibilityRole="link" onPress={jest.fn()} />,
    );

    expect(screen.getByRole("link", { name: "Website" })).toBeTruthy();
  });

  it("buzzes and calls onPress when tapped", async () => {
    const onPress = jest.fn();
    await render(<RowCard title="Vespers" onPress={onPress} />);

    await fireEvent.press(screen.getByText("Vespers"));

    expect(Haptics.impactAsync).toHaveBeenCalledWith("medium");
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
