import { faBed } from "@fortawesome/free-solid-svg-icons/faBed";
import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet } from "react-native";
import PrayerRow from "./PrayerRow";

let mockScheme: "light" | "dark" = "light";

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => mockScheme,
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

// The package ships untranspiled ESM, which Jest can't load. The stand-in
// shows the colour it was given, so a test can read it.
jest.mock("@fortawesome/react-native-fontawesome", () => ({
  FontAwesomeIcon: ({ color }: { color: string }) => {
    const { Text } = require("react-native");
    return <Text testID="row-icon">{color}</Text>;
  },
}));

describe("PrayerRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScheme = "light";
  });

  it("sets the title like an event row's title and the subtitle like its time", async () => {
    await render(
      <PrayerRow title="Vespers" subtitle="Evening" onPress={jest.fn()} />,
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

  it("is a white card with the event rows' 8pt corners", async () => {
    await render(<PrayerRow title="Vespers" onPress={jest.fn()} />);

    expect(screen.getByRole("button")).toHaveStyle({
      backgroundColor: Colours.light.itemBackground,
      borderRadius: 8,
    });
  });

  it("ends in a chevron, the way an event row does", async () => {
    await render(<PrayerRow title="Vespers" onPress={jest.fn()} />);

    expect(screen.getByTestId("prayer-row-chevron")).toBeTruthy();
  });

  it("shows its icon in the brand navy in light mode", async () => {
    await render(
      <PrayerRow title="Vespers" icon={faBed} onPress={jest.fn()} />,
    );

    expect(screen.getByTestId("row-icon")).toHaveTextContent(
      Colours.light.primary,
    );
  });

  it("shows its icon in the brand colour in dark mode, where that is the bronze", async () => {
    mockScheme = "dark";

    await render(
      <PrayerRow title="Vespers" icon={faBed} onPress={jest.fn()} />,
    );

    expect(screen.getByTestId("row-icon")).toHaveTextContent(
      Colours.dark.primary,
    );
  });

  it("shows no icon when it has none", async () => {
    await render(<PrayerRow title="Vespers" onPress={jest.fn()} />);

    expect(screen.queryByTestId("row-icon")).toBeNull();
  });

  it("is one button that a screen reader reads as the title and subtitle", async () => {
    await render(
      <PrayerRow title="Vespers" subtitle="Evening" onPress={jest.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Vespers, Evening" }),
    ).toBeTruthy();
  });

  it("is read as just the title when it has no subtitle", async () => {
    await render(<PrayerRow title="Vespers" onPress={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Vespers" })).toBeTruthy();
  });

  it("buzzes and calls onPress when tapped", async () => {
    const onPress = jest.fn();
    await render(<PrayerRow title="Vespers" onPress={onPress} />);

    await fireEvent.press(screen.getByText("Vespers"));

    expect(Haptics.impactAsync).toHaveBeenCalledWith("medium");
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
