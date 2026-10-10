import ParishScreen from "./ParishScreen";
import { PARISH_LINKS } from "../constants";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { Colours } from "@/theme/colours";
import { fontFamily } from "@/theme/typography";
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

  it("divides the intro, Giving, Connect and The App with ornamental dividers", async () => {
    await render(<ParishScreen />);

    const tree = JSON.stringify(screen.toJSON());
    const at = (needle: string, from = 0) => tree.indexOf(needle, from);
    const intro = at("This app is developed");
    const first = at("ornamental-divider", intro);
    const giving = at("Giving", first);
    const second = at("ornamental-divider", giving);
    const connect = at("Connect", second);
    const third = at("ornamental-divider", connect);
    const theApp = at("The App", third);

    expect(screen.getAllByTestId("ornamental-divider", { hidden: true })).toHaveLength(3);
    expect([intro, first, giving, second, connect, third, theApp]).toEqual(
      [intro, first, giving, second, connect, third, theApp].sort(
        (a, b) => a - b,
      ),
    );
    expect(intro).toBeGreaterThan(-1);
  });

  it("sets its section headings like Prayer's: serif, 20pt in, as headers", async () => {
    await render(<ParishScreen />);

    for (const heading of ["Connect", "The App"]) {
      expect(screen.getByText(heading)).toHaveStyle({
        fontFamily: fontFamily.serif,
        fontWeight: "700",
        marginHorizontal: 20,
        textAlign: "left",
        color: Colours.light.moreImportantText,
      });
      expect(screen.getByRole("header", { name: heading })).toBeTruthy();
    }
  });

  it("insets the intro 20pt, in line with the large title and the headings", async () => {
    await render(<ParishScreen />);

    expect(screen.getByText(/This app is developed/)).toHaveStyle({
      marginHorizontal: 20,
    });
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
