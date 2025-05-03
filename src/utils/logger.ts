// Utility functions for consistent logging

export const debug = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.debug('%c🐞 [DEBUG]', 'color: #8a2be2', ...args);
  }
};

export const info = (...args: any[]) => {
  console.info('%cℹ️ [INFO]', 'color: #0066cc', ...args);
};

export const warn = (...args: any[]) => {
  console.warn('%c⚠️ [WARN]', 'color: #ff9900; font-weight: bold', ...args);
};

export const error = (...args: any[]) => {
  console.error('%c❌ [ERROR]', 'color: #ff0000; font-weight: bold', ...args);
};