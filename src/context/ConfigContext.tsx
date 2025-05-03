import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConfigStore } from '../store';

import type { AppConfig, Theme } from '../store/useConfigStore';

const ConfigContext = createContext<{
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}>({ 
  config: {} as AppConfig, 
   updateConfig: () => {},
   setTheme: () => {},
   toggleTheme: () => {},
   isDark: true
});

interface ConfigProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AppConfig>;
}

export function ConfigProvider({ children, initialConfig = {} }: ConfigProviderProps) {
  // Use the config store instead of local state
  const { config, updateConfig, setTheme, toggleTheme, isDark } = useConfigStore();
  
  // Apply initial config if provided
  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      updateConfig(initialConfig);
    }
  }, []);

  // Debug mode - log config in dev mode
  if (config.debug) {
    console.log('App Config:', config);
  }

  return (
    <ConfigContext.Provider value={{ config, updateConfig, setTheme, toggleTheme, isDark }}>
      {/* Apply theme class based on config */}
      {children}
    </ConfigContext.Provider>
  );
}

// Hook to use the config
export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

// Utility hook for feature flags
export function useFeature(featureName: keyof AppConfig['features']) {
  const { config } = useConfig();
  return config.features[featureName];
}

// Utility hook for theme management
export function useTheme() {
  const { config, setTheme, toggleTheme, isDark } = useConfig();
  return { 
    theme: config.theme, 
    isDark, 
    setTheme, 
    toggleTheme 
  };
}