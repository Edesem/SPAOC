// hooks/useColorScheme.ts
import { useSettingsStore, type ThemeChoice } from "@/services/settings";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type { ThemeChoice };

export function useColorScheme(): "light" | "dark" {
  const system = useSystemColorScheme();
  const themeChoice = useSettingsStore((state) => state.themeChoice);

  if (themeChoice === "auto") {
    return system === "dark" ? "dark" : "light";
  }
  return themeChoice;
}
