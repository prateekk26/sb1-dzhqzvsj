import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from './Button';

// Error reporting service interface
interface ErrorReportingService {
  captureException: (error: Error, errorInfo?: React.ErrorInfo) => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropChange?: boolean;
  resetKeys?: any[];
  errorReportingService?: ErrorReportingService;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('Error caught by error boundary:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Generate a unique error ID for reference
    const errorId = `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    this.setState({ errorId });
    
    // Log error to external service if provided
    if (this.props.errorReportingService) {
      this.props.errorReportingService.captureException(error, errorInfo);
    } else {
      // Fallback to local error logging
      this.logErrorToService(error, errorInfo);
    }
  }
  
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state if resetOnPropChange is true and one of the resetKeys has changed
    if (
      this.state.hasError &&
      this.props.resetOnPropChange &&
      this.props.resetKeys &&
      this.props.resetKeys.some((key, i) => key !== prevProps.resetKeys?.[i])
    ) {
      this.resetErrorBoundary();
    }
  }

  // Log error to an external service (placeholder function)
  logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // In a real app, this would send the error to your monitoring service
    console.group('Application Error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Time:', new Date().toISOString());
    console.error('User Agent:', navigator.userAgent);
    console.error('URL:', window.location.href);
    console.groupEnd();
  }
  
  // Reset the error boundary state
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen bg-[#0F121A] flex flex-col items-center justify-center p-4">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md w-full text-center shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
            <p className="text-red-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            {this.state.errorId && (
              <div className="mb-4 p-2 bg-gray-800/50 rounded-lg text-center">
                <p className="text-xs text-gray-400">Error reference: <span className="font-mono">{this.state.errorId}</span></p>
              </div>
            )}
            <p className="text-gray-400 text-sm mb-6">
              We've logged this error and our team will look into it. Please try again or contact support if the problem persists.
            </p>
            <Button
              onClick={this.resetErrorBoundary}
              leftIcon={RefreshCw}
              className="bg-[#FF8A00] hover:bg-[#E67A00] text-white shadow-md"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ErrorBoundary HOC for wrapping components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
  displayName?: string
): React.FC<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  // Set display name for better debugging
  WrappedComponent.displayName = `withErrorBoundary(${displayName || Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}