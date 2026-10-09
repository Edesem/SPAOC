import PdfViewer from "./PdfViewerScreen";
import { Colours } from "@/theme/colours";
import { PdfViewerParams } from "@/types/routes";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { ActivityIndicator, Platform, StyleSheet } from "react-native";

const params: PdfViewerParams = {
  url: "https://example.com/prayer%20book.pdf",
  title: "Morning Prayer",
};
const mockSetOptions = jest.fn();
const mockMounted = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => params,
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));
let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));
// Stands in for the native view, which Jest cannot run: it exposes the props
// the screen passes and reports each time it is mounted, so a test can tell a
// remount from a re-render.
jest.mock("react-native-pdf", () => {
  const React = require("react");
  const { View } = require("react-native");
  function MockPdf(props: object) {
    React.useEffect(() => mockMounted(), []);
    return <View testID="pdf" {...props} />;
  }
  return { __esModule: true, default: MockPdf };
});

const lastPdf = (utils: { getByTestId: (id: string) => any }) =>
  utils.getByTestId("pdf");

describe("PdfViewer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  });

  it("titles the screen from its route params", async () => {
    await render(<PdfViewer />);

    expect(mockSetOptions).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Morning Prayer" }),
    );
  });

  it.each(["ios", "android"] as const)(
    "opens the route url as given on %s, cached on the device",
    async (os) => {
      jest.replaceProperty(Platform, "OS", os);

      const utils = await render(<PdfViewer />);

      expect(lastPdf(utils).props.source).toEqual(
        expect.objectContaining({ uri: params.url, cache: true }),
      );
      expect(lastPdf(utils).props.source.uri).not.toContain("docs.google.com");
    },
  );

  it("expires the cached copy so a replaced file is picked up", async () => {
    const utils = await render(<PdfViewer />);

    const { expiration } = lastPdf(utils).props.source;
    expect(expiration).toBe(7 * 24 * 60 * 60);
  });

  it("checks the server's certificate", async () => {
    const utils = await render(<PdfViewer />);

    expect(lastPdf(utils).props.trustAllCerts).toBe(false);
  });

  it("fits the page to the width so landscape gives larger text", async () => {
    const utils = await render(<PdfViewer />);

    expect(lastPdf(utils).props.fitPolicy).toBe(0);
  });

  it("shows a spinner while the file loads", async () => {
    const utils = await render(<PdfViewer />);

    const spinner = lastPdf(utils).props.renderActivityIndicator(0.4);
    expect(spinner.type).toBe(ActivityIndicator);
    expect(spinner.props.color).toBe(Colours.light.primary);
  });

  it("keeps pages clear of the notch when rotated", async () => {
    mockInsets = { top: 0, bottom: 0, left: 47, right: 47 };

    const utils = await render(<PdfViewer />);

    expect(StyleSheet.flatten(lastPdf(utils).parent?.props.style)).toEqual(
      expect.objectContaining({ paddingLeft: 47, paddingRight: 47 }),
    );
  });

  describe("when the file cannot be opened", () => {
    it("says so and offers to try again", async () => {
      const utils = await render(<PdfViewer />);

      await act(async () =>
        lastPdf(utils).props.onError(new Error("no network")),
      );

      expect(utils.getByText("Couldn't open this PDF")).toBeTruthy();
      expect(utils.getByLabelText("Try opening this PDF again")).toBeTruthy();
      expect(utils.queryByTestId("pdf")).toBeNull();
    });

    it("loads it afresh when Try again is pressed", async () => {
      const utils = await render(<PdfViewer />);
      expect(mockMounted).toHaveBeenCalledTimes(1);
      await act(async () =>
        lastPdf(utils).props.onError(new Error("no network")),
      );

      await fireEvent.press(utils.getByLabelText("Try opening this PDF again"));

      expect(utils.queryByText("Couldn't open this PDF")).toBeNull();
      expect(lastPdf(utils)).toBeTruthy();
      expect(mockMounted).toHaveBeenCalledTimes(2);
    });
  });
});
