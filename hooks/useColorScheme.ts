// hooks/useColorScheme.ts
import eventBus from "@/utils/eventBus";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type ThemeChoice = "light" | "dark" | "auto";

export function useColorScheme(): "light" | "dark" {
  const system = useSystemColorScheme();
  const systemTheme: "light" | "dark" = system === "dark" ? "dark" : "light";
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    systemTheme,
  );

  useEffect(() => {
    AsyncStorage.getItem("APP_THEME").then((choice) => {
      const effective =
        choice === "dark" || choice === "light" ? choice : systemTheme;
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
