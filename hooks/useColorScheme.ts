// hooks/useColorScheme.ts
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import eventBus from '@/utils/eventBus';

export type ThemeChoice = 'light' | 'dark' | 'auto';

export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(system ?? 'light');

  useEffect(() => {
    AsyncStorage.getItem('APP_THEME').then((choice) => {
      const effective = choice === 'dark' || choice === 'light' ? choice : system;
      setResolvedTheme(effective ?? 'light');
    });

    const handleThemeChange = (choice: ThemeChoice) => {
      const effective = choice === 'auto' ? system : choice;
      setResolvedTheme(effective ?? 'light');
    };

    eventBus.on('themeChanged', handleThemeChange);

    return () => {
      eventBus.off('themeChanged', handleThemeChange);
    };
  }, [system]);

  return resolvedTheme;
}
