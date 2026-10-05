import type { PdfViewerParams } from "@/types/routes";
import { Alert } from "react-native";
import { openPdf, openServicePdf } from "./openServicePdf";

const router = { push: jest.fn() };
const pdf: PdfViewerParams = { url: "https://x/vespers.pdf", title: "Vespers" };

// What the OK button on the alert does.
const pressOk = () => {
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
  buttons[0].onPress();
};

describe("openPdf", () => {
  it("opens the PDF viewer straight away, with no alert", () => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});

    openPdf(router, pdf);

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/pdfViewer",
      params: pdf,
    });
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});

describe("openServicePdf", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("asks the user to silence their phone before opening anything", () => {
    openServicePdf(router, pdf);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Silence Your Phone!",
      "Before opening this prayer, please ensure your phone is on silent.",
      [expect.objectContaining({ text: "OK" })],
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("opens the PDF viewer once the alert is confirmed", () => {
    openServicePdf(router, pdf);

    pressOk();

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/pdfViewer",
      params: pdf,
    });
  });
});
