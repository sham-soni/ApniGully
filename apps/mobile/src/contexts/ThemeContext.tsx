import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: typeof lightColors.primary;
  neutral: typeof lightColors.neutral;
  success: typeof lightColors.success;
  warning: typeof lightColors.warning;
  error: typeof lightColors.error;
  white: string;
  black: string;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: {
    default: string;
    light: string;
  };
}

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  colors: ThemeColors;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const lightColors = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  white: '#ffffff',
  black: '#000000',
  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
  },
  text: {
    primary: '#171717',
    secondary: '#525252',
    muted: '#737373',
  },
  border: {
    default: '#e5e5e5',
    light: '#f5f5f5',
  },
};

const darkColors: ThemeColors = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  neutral: {
    50: '#171717',
    100: '#262626',
    200: '#404040',
    300: '#525252',
    400: '#737373',
    500: '#a3a3a3',
    600: '#d4d4d4',
    700: '#e5e5e5',
    800: '#f5f5f5',
    900: '#fafafa',
  },
  success: {
    50: '#052e16',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#422006',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#450a0a',
    500: '#ef4444',
    600: '#dc2626',
  },
  white: '#ffffff',
  black: '#000000',
  background: {
    primary: '#171717',
    secondary: '#0a0a0a',
    tertiary: '#262626',
  },
  text: {
    primary: '#fafafa',
    secondary: '#d4d4d4',
    muted: '#a3a3a3',
  },
  border: {
    default: '#404040',
    light: '#262626',
  },
};

const THEME_STORAGE_KEY = '@apnigully_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setThemeState(storedTheme as ThemeMode);
      }
    } catch (error) {
      // Use default theme
    } finally {
      setIsLoaded(true);
    }
  };

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system'
      ? (systemColorScheme || 'light')
      : theme;

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export colors for backward compatibility with existing code
export { lightColors, darkColors };
