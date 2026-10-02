import PdfViewer from "./PdfViewerScreen";
import { PdfViewerParams } from "@/types/routes";
import { render } from "@testing-library/react-native";
import React from "react";

const params: PdfViewerParams = {
  url: "https://example.com/prayer.pdf",
  title: "Morning Prayer",
};
const mockSetOptions = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => params,
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));
jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return { WebView: (props: object) => <View testID="webview" {...props} /> };
});

describe("PdfViewer", () => {
  it("titles the screen and loads the pdf from its route params", async () => {
    const { findByTestId } = await render(<PdfViewer />);

    expect((await findByTestId("webview")).props.source.uri).toContain(
      params.url,
    );
    expect(mockSetOptions).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Morning Prayer" }),
    );
  });
});
