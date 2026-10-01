import { useColorScheme } from "@/hooks/useColorScheme";
import { useSettingsStore } from "@/services/settings";
import { act, renderHook } from "@testing-library/react-native";
import { useColorScheme as useSystemColorScheme } from "react-native";

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(),
}));

const systemScheme = useSystemColorScheme as unknown as jest.Mock;

describe("useColorScheme", () => {
  beforeEach(() => {
    useSettingsStore.setState({ themeChoice: "auto" });
  });

  it("follows the system scheme on auto", async () => {
    systemScheme.mockReturnValue("dark");
    const { result } = await renderHook(() => useColorScheme());
    expect(result.current).toBe("dark");
  });

  it("falls back to light when the system scheme is unknown", async () => {
    systemScheme.mockReturnValue(null);
    const { result } = await renderHook(() => useColorScheme());
    expect(result.current).toBe("light");
  });

  it("uses the stored theme choice over the system scheme", async () => {
    systemScheme.mockReturnValue("dark");
    useSettingsStore.setState({ themeChoice: "light" });
    const { result } = await renderHook(() => useColorScheme());
    expect(result.current).toBe("light");
  });

  it("updates when the theme choice changes", async () => {
    systemScheme.mockReturnValue("light");
    const { result } = await renderHook(() => useColorScheme());

    await act(async () => {
      useSettingsStore.getState().setThemeChoice("dark");
    });

    expect(result.current).toBe("dark");
  });
});
