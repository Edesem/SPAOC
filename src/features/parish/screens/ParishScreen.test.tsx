import ParishScreen from "./ParishScreen";
import { PARISH_LINKS } from "../constants";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: jest.fn(),
}));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
jest.mock("react-native-toast-message", () => ({ show: jest.fn() }));
jest.mock("@/components/ui/IconSymbol", () => ({ IconSymbol: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("ParishScreen", () => {
  let openURL: jest.SpyInstance;

  beforeEach(() => {
    mockPush.mockClear();
    jest.mocked(Haptics.impactAsync).mockClear();
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterEach(() => {
    openURL.mockRestore();
  });

  it("shows Giving, then Connect, then The App", async () => {
    await render(<ParishScreen />);

    const order = ["Giving", "Connect", "The App"].map((heading) =>
      screen.toJSON() && JSON.stringify(screen.toJSON()).indexOf(heading),
    );
    expect(order.every((i) => typeof i === "number" && i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => Number(a) - Number(b)));
  });

  it.each(PARISH_LINKS.map((link) => [link.label, link.url]))(
    "opens %s",
    async (label, url) => {
      await render(<ParishScreen />);

      await fireEvent.press(screen.getByText(label));

      expect(openURL).toHaveBeenCalledWith(url);
    },
  );

  it("buzzes once when a link row is tapped", async () => {
    await render(<ParishScreen />);

    await fireEvent.press(screen.getByText(PARISH_LINKS[0].label));

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it("buzzes once when an in-app row is tapped", async () => {
    await render(<ParishScreen />);

    await fireEvent.press(screen.getByText("Settings"));

    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it("pushes Help from its row", async () => {
    await render(<ParishScreen />);

    await fireEvent.press(screen.getByText("Help & feedback"));

    expect(mockPush).toHaveBeenCalledWith("/help");
  });

  it("pushes Settings from its row", async () => {
    await render(<ParishScreen />);

    await fireEvent.press(screen.getByText("Settings"));

    expect(mockPush).toHaveBeenCalledWith("/settings");
  });
});
