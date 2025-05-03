import React, { ReactNode, useEffect } from 'react';
import { useConfigStore } from '../store';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system'; 
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'dark' 
}: ThemeProviderProps) {
  const { config, setTheme } = useConfigStore();
  
  // Set initial theme if provided
  useEffect(() => {
    if (defaultTheme && defaultTheme !== config.theme) {
      setTheme(defaultTheme);
    }
  }, [defaultTheme, config.theme, setTheme]);

  return (
    <div className={`app-theme ${config.theme}`}>
      {children}
    </div>
  );
}