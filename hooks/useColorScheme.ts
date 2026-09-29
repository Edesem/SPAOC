// hooks/useColorScheme.ts
import { getThemeChoice, type ThemeChoice } from "@/services/settings";
import eventBus from "@/utils/eventBus";
import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type { ThemeChoice };

export function useColorScheme(): "light" | "dark" {
  const system = useSystemColorScheme();
  const systemTheme: "light" | "dark" = system === "dark" ? "dark" : "light";
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    systemTheme,
  );

  useEffect(() => {
    getThemeChoice().then((choice) => {
      const effective = choice === "auto" ? systemTheme : choice;
      setResolvedTheme(effective);
    });

    const handleThemeChange = (choice: ThemeChoice) => {
      const effective = choice === "auto" ? systemTheme : choice;
      setResolvedTheme(effective);
    };

    eventBus.on("themeChanged", handleThemeChange);

    return () => {
      eventBus.off("themeChanged", handleThemeChange);
    };
  }, [system]);

  return resolvedTheme;
}
