import { renderHook } from "@testing-library/react-native";
import { useWindowDimensions } from "react-native";

import {
  READABLE_MAX_WIDTH,
  readableGutter,
  useReadableGutter,
} from "./useReadableGutter";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("readableGutter", () => {
  it("leaves phone widths untouched", () => {
    expect(readableGutter(320)).toBe(0);
    expect(readableGutter(430)).toBe(0);
    expect(readableGutter(READABLE_MAX_WIDTH)).toBe(0);
  });

  it("centres a readable column on wider windows", () => {
    expect(readableGutter(1024)).toBe(192);
    expect(readableGutter(820)).toBe(90);
  });
});

describe("useReadableGutter", () => {
  it("reads the live window width", async () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1024 });

    const { result } = await renderHook(() => useReadableGutter());

    expect(result.current).toBe(192);
  });
});
