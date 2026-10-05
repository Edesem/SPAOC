import type { PdfViewerParams } from "@/types/routes";
import { Alert } from "react-native";

// The part of the expo-router router these helpers use.
type PdfRouter = {
  push: (href: { pathname: "/pdfViewer"; params: PdfViewerParams }) => void;
};

export function openPdf(router: PdfRouter, params: PdfViewerParams): void {
  router.push({ pathname: "/pdfViewer", params });
}

// Reminds the user to silence their phone before a service text opens.
export function openServicePdf(
  router: PdfRouter,
  params: PdfViewerParams,
): void {
  Alert.alert(
    "Silence Your Phone!",
    "Before opening this prayer, please ensure your phone is on silent.",
    [{ text: "OK", onPress: () => openPdf(router, params) }],
  );
}
