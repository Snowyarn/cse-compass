import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ColorTheme, darkTheme, lightTheme } from '../theme/colors';
import { Repository } from '../database/repository';

interface ThemeContextType {
  theme: ColorTheme;
  themeMode: 'system' | 'dark' | 'light';
  setThemeMode: (mode: 'system' | 'dark' | 'light') => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  themeMode: 'dark',
  setThemeMode: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<'system' | 'dark' | 'light'>('dark');

  useEffect(() => {
    try {
      const settings = Repository.getSettings();
      if (settings && settings.theme) {
        setThemeModeState(settings.theme);
      }
    } catch {
      // Fallback
    }
  }, []);

  const setThemeMode = (mode: 'system' | 'dark' | 'light') => {
    setThemeModeState(mode);
    try {
      Repository.updateSettings({ theme: mode });
    } catch (e) {
      console.warn('Failed to persist theme setting:', e);
    }
  };

  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
