import { faBed } from "@fortawesome/free-solid-svg-icons/faBed";
import { fontFamily } from "@/theme/typography";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { PdfEntry } from "../catalogue";
import PdfListSection from "./PdfListSection";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

// The package ships untranspiled ESM, which Jest can't load.
jest.mock("@fortawesome/react-native-fontawesome", () => ({
  FontAwesomeIcon: () => null,
}));

const entries: PdfEntry[] = [
  {
    title: "Vespers",
    subtitle: "Evening",
    url: "https://x/v.pdf",
    icon: faBed,
  },
  { title: "Matins", subtitle: "Morning", url: "https://x/m.pdf", icon: faBed },
];

describe("PdfListSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets the heading in the serif and the entries in the sans", async () => {
    await render(<PdfListSection heading="Services" entries={entries} />);

    expect(screen.getByText("Services")).toHaveStyle({
      fontFamily: fontFamily.serif,
      fontWeight: "700",
    });
    expect(screen.getByText("Vespers")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontSize: 19,
    });
    expect(screen.getByText("Evening")).toHaveStyle({
      fontFamily: fontFamily.sans,
      fontStyle: "italic",
    });
  });

  it("shows the heading and each entry with its subtitle", async () => {
    await render(<PdfListSection heading="Services" entries={entries} />);

    expect(screen.getByText("Services")).toBeTruthy();
    expect(screen.getByText("Vespers")).toBeTruthy();
    expect(screen.getByText("Evening")).toBeTruthy();
    expect(screen.getByText("Matins")).toBeTruthy();
    expect(screen.getByText("Morning")).toBeTruthy();
  });

  it("opens an entry's PDF straight away by default", async () => {
    await render(<PdfListSection heading="Prayers" entries={entries} />);

    await fireEvent.press(screen.getByText("Matins"));

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/pdfViewer",
      params: { url: "https://x/m.pdf", title: "Matins" },
    });
  });

  it("asks the user to silence their phone first when told to", async () => {
    await render(
      <PdfListSection heading="Services" entries={entries} silencePhone />,
    );

    await fireEvent.press(screen.getByText("Vespers"));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    buttons[0].onPress();

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/pdfViewer",
      params: { url: "https://x/v.pdf", title: "Vespers" },
    });
  });
});
