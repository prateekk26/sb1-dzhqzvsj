import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ConfigProvider, useConfig, useFeature } from '../../context/ConfigContext';
import { vi } from 'vitest';

// Test component that uses the useConfig hook
const ConfigConsumer = () => {
  const { config, updateConfig } = useConfig();
  
  return (
    <div>
      <div data-testid="config-debug">{config.debug ? 'Debug On' : 'Debug Off'}</div>
      <div data-testid="config-theme">{config.theme}</div>
      <button 
        onClick={() => updateConfig({ debug: !config.debug })}
        data-testid="toggle-debug"
      >
        Toggle Debug
      </button>
      <button 
        onClick={() => updateConfig({ theme: config.theme === 'dark' ? 'light' : 'dark' })}
        data-testid="toggle-theme"
      >
        Toggle Theme
      </button>
    </div>
  );
};

// Test component that uses the useFeature hook
const FeatureConsumer = ({ featureName }: { featureName: string }) => {
  const isEnabled = useFeature(featureName as any);
  
  return (
    <div data-testid={`feature-${featureName}`}>
      {isEnabled ? `${featureName} Enabled` : `${featureName} Disabled`}
    </div>
  );
};

describe('ConfigContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset any mocks
    vi.clearAllMocks();
  });
  
  test('provides default config values', () => {
    render(
      <ConfigProvider>
        <ConfigConsumer />
      </ConfigProvider>
    );
    
    expect(screen.getByTestId('config-debug')).toHaveTextContent('Debug Off');
    expect(screen.getByTestId('config-theme')).toHaveTextContent('dark');
  });
  
  test('allows updating config values', () => {
    render(
      <ConfigProvider>
        <ConfigConsumer />
      </ConfigProvider>
    );
    
    // Initial state
    expect(screen.getByTestId('config-debug')).toHaveTextContent('Debug Off');
    
    // Update debug setting
    act(() => {
      screen.getByTestId('toggle-debug').click();
    });
    
    // Check updated state
    expect(screen.getByTestId('config-debug')).toHaveTextContent('Debug On');
  });
  
  test('applies initial config when provided', () => {
    render(
      <ConfigProvider initialConfig={{ theme: 'light', debug: true }}>
        <ConfigConsumer />
      </ConfigProvider>
    );
    
    expect(screen.getByTestId('config-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('config-debug')).toHaveTextContent('Debug On');
  });
  
  test('useFeature hook returns feature flag status', () => {
    render(
      <ConfigProvider initialConfig={{ 
        features: { 
          mockInterviews: true,
          resumeReview: false 
        } 
      }}>
        <FeatureConsumer featureName="mockInterviews" />
        <FeatureConsumer featureName="resumeReview" />
      </ConfigProvider>
    );
    
    expect(screen.getByTestId('feature-mockInterviews')).toHaveTextContent('mockInterviews Enabled');
    expect(screen.getByTestId('feature-resumeReview')).toHaveTextContent('resumeReview Disabled');
  });
  
  test('throws error when useConfig is used outside provider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    expect(() => {
      render(<ConfigConsumer />);
    }).toThrow('useConfig must be used within a ConfigProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  test('persists config changes to localStorage', () => {
    const { unmount } = render(
      <ConfigProvider>
        <ConfigConsumer />
      </ConfigProvider>
    );
    
    // Update theme
    act(() => {
      screen.getByTestId('toggle-theme').click();
    });
    
    // Unmount to ensure persistence
    unmount();
    
    // Check localStorage
    const stored = JSON.parse(localStorage.getItem('app-config-storage') || '{}');
    expect(stored.state.config.theme).toBe('light');
  });
});