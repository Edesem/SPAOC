import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { renderHook, waitFor } from "@testing-library/react-native";
import { Platform } from "react-native";
import { useToolbarIcon } from "./useToolbarIcon";

afterEach(() => jest.restoreAllMocks());

describe("useToolbarIcon", () => {
  it("returns the SF Symbol on iOS without rendering a Material glyph", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const getImageSource = jest.spyOn(MaterialIcons, "getImageSource");

    const { result } = await renderHook(() =>
      useToolbarIcon("doc.on.doc", "content-copy", "#123456"),
    );

    expect(result.current).toBe("doc.on.doc");
    expect(getImageSource).not.toHaveBeenCalled();
  });

  it("renders the Material glyph to an image on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const source = { uri: "file:///copy.png", scale: 3, width: 24, height: 24 };
    const getImageSource = jest
      .spyOn(MaterialIcons, "getImageSource")
      .mockResolvedValue(source);

    const { result } = await renderHook(() =>
      useToolbarIcon("doc.on.doc", "content-copy", "#123456"),
    );

    await waitFor(() => expect(result.current).toBe(source));
    expect(getImageSource).toHaveBeenCalledWith("content-copy", 24, "#123456");
  });

  it("stays without an icon on Android when the glyph cannot be rendered", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    jest.spyOn(MaterialIcons, "getImageSource").mockResolvedValue(null);

    const { result } = await renderHook(() =>
      useToolbarIcon("star", "star", "#123456"),
    );

    await waitFor(() =>
      expect(MaterialIcons.getImageSource).toHaveBeenCalled(),
    );
    expect(result.current).toBeUndefined();
  });
});
