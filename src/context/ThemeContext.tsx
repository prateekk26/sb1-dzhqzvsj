import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useThemeStore } from '../store';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'dark'
}: ThemeProviderProps) {
  // Use the theme store instead of local state
  const { theme, isDark, setTheme } = useThemeStore();
  
  // Set initial theme if provided
  useEffect(() => {
    if (defaultTheme && defaultTheme !== theme) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, theme, setTheme]);

  const value = {
    theme,
    setTheme,
    isDark
  };

  return (
    <ThemeContext.Provider value={value}>
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