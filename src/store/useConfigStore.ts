import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface AppConfig {
  apiUrl: string;
  dateFormat: string;
  enableAnalytics: boolean;
  features: {
    mockInterviews: boolean;
    resumeReview: boolean;
    linkedInImport: boolean;
    truthWall: boolean;
  };
  debug: boolean;
  theme: Theme;
}

interface ConfigState {
  config: AppConfig;
  isDark: boolean;
}

interface ConfigActions {
  updateConfig: (updates: Partial<AppConfig>) => void;
  updateFeature: (featureName: keyof AppConfig['features'], enabled: boolean) => void;
  toggleDebug: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  applyTheme: (theme: Theme) => void;
}

// Default configuration values
const defaultConfig: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  dateFormat: 'MMM DD, YYYY',
  enableAnalytics: import.meta.env.PROD || false,
  features: {
    mockInterviews: true,
    resumeReview: true,
    linkedInImport: true,
    truthWall: true
  },
  debug: import.meta.env.DEV || false,
  theme: 'dark'
};

export const useConfigStore = create<ConfigState & ConfigActions>()(
  persist(
    (set, get) => ({
      // Initial state
      config: defaultConfig,
      isDark: true,
      
      // Actions
      updateConfig: (updates) => set((state) => ({
        config: {
          ...state.config,
          ...updates,
          // Handle nested feature updates
          features: {
            ...state.config.features,
            ...(updates.features || {})
          }
        }
      })),
      
      updateFeature: (featureName, enabled) => set((state) => ({
        config: {
          ...state.config,
          features: {
            ...state.config.features,
            [featureName]: enabled
          }
        }
      })),
      
      toggleDebug: () => set((state) => ({
        config: {
          ...state.config,
          debug: !state.config.debug
        }
      })),

      // Theme management
      setTheme: (theme) => {
        const { applyTheme } = get();
        applyTheme(theme);
        
        set((state) => ({
          config: {
            ...state.config,
            theme
          }
        }));
      },
      
      toggleTheme: () => {
        const { config, setTheme } = get();
        const newTheme = config.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
      },
      
      applyTheme: (theme) => {
        // Determine if dark mode should be active
        let isDark = theme === 'dark';
        
        if (theme === 'system') {
          // Use system preference
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          isDark = systemDark;
        }
        
        // Apply theme to document
        document.documentElement.classList.toggle('dark', isDark);
        
        // Update state
        set({ isDark });
      }
    }),
    {
      name: 'app-config-storage',
      partialize: (state) => ({ config: state.config, isDark: state.isDark }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme when rehydrating from storage
          state.applyTheme(state.config.theme);
          
          // Listen for system theme changes if using system theme
          if (state.config.theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = () => {
              state.applyTheme('system');
            };
            
            mediaQuery.addEventListener('change', handleChange);
            
            // Return cleanup function
            return () => mediaQuery.removeEventListener('change', handleChange);
          }
        }
      }
    }
  )
);