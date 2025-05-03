import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '../Alert';
import { vi } from 'vitest';

describe('Alert Component', () => {
  test('renders alert with correct variant', () => {
    render(
      <Alert variant="error" message="This is an error message" />
    );
    
    expect(screen.getByText('This is an error message')).toBeInTheDocument();
    expect(screen.getByText('This is an error message').parentElement?.parentElement).toHaveClass('bg-red-900/50');
  });

  test('renders with title when provided', () => {
    render(
      <Alert 
        variant="success" 
        title="Success Title" 
        message="This is a success message"
      />
    );
    
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('This is a success message')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    
    render(
      <Alert 
        variant="info" 
        message="This is an info message" 
        onClose={onCloseMock}
      />
    );
    
    // Find the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('doesn\'t render close button when onClose is not provided', () => {
    render(
      <Alert variant="warning" message="This is a warning message" />
    );
    
    const closeButton = screen.queryByRole('button', { name: /close/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    render(
      <Alert 
        variant="info" 
        message="This is an info message" 
        className="custom-class"
      />
    );
    
    // Find the alert container
    const alertContainer = screen.getByText('This is an info message').parentElement?.parentElement;
    expect(alertContainer).toHaveClass('custom-class');
  });

  test('renders with custom icon when provided', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
    
    render(
      <Alert 
        variant="info" 
        message="This is an info message" 
        icon={CustomIcon}
      />
    );
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  test('auto-closes after specified time', () => {
    vi.useFakeTimers();
    const onCloseMock = vi.fn();
    
    render(
      <Alert 
        variant="info" 
        message="This is an info message" 
        onClose={onCloseMock}
        autoClose={2000}
      />
    );
    
    expect(onCloseMock).not.toHaveBeenCalled();
    
    // Fast-forward time
    vi.advanceTimersByTime(2000);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  test('renders with debug variant', () => {
    render(
      <Alert variant="debug" message="This is a debug message" />
    );
    
    expect(screen.getByText('This is a debug message')).toBeInTheDocument();
    expect(screen.getByText('This is a debug message').parentElement?.parentElement).toHaveClass('bg-purple-900/50');
  });
});