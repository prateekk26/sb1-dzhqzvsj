import React, { useState, useEffect } from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { Alert } from './Alert';
import { Button } from './Button';
import { ErrorResponse } from '../utils/types';

interface ErrorHandlerProps {
  error: string | ErrorResponse | null;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
  autoHideAfter?: number; // Time in ms after which the error will auto-hide
}

export function ErrorHandler({ 
  error, 
  onClose, 
  onRetry,
  className = '',
  autoHideAfter
}: ErrorHandlerProps) {
  const [visible, setVisible] = useState(!!error);
  
  // Reset visibility when error changes
  useEffect(() => {
    setVisible(!!error);
  }, [error]);
  
  // Auto-hide after specified time
  useEffect(() => {
    if (error && autoHideAfter && onClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for fade-out animation
      }, autoHideAfter);
      
      return () => clearTimeout(timer);
    }
  }, [error, autoHideAfter, onClose]);
  
  // If no error or not visible, don't render anything
  if (!error || !visible) {
    return null;
  }
  
  // Parse the error
  let errorMessage: string;
  let errorType: string = 'error';
  let errorDetails: string | null = null;
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = error.message;
    errorType = error.type.toLowerCase();
    errorDetails = error.details || null;
  }
  
  // Map error type to alert variant
  const getVariant = () => {
    switch (errorType) {
      case 'network':
      case 'timeout':
        return 'warning';
      case 'validation':
        return 'info';
      case 'auth':
      case 'permission':
      case 'not_found':
      case 'server':
      default:
        return 'error';
    }
  };
  
  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 300); // Wait for fade-out animation
    }
  };
  
  return (
    <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <Alert
        variant={getVariant() as 'error' | 'warning' | 'info'}
        message={
          <div>
            <p>{errorMessage}</p>
            {errorDetails && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Technical Details</summary>
                <pre className="mt-2 p-2 bg-gray-800 rounded text-xs whitespace-pre-wrap text-gray-300 max-h-40 overflow-auto">
                  {errorDetails}
                </pre>
              </details>
            )}
            {onRetry && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={RefreshCw}
                  onClick={() => {
                    if (onRetry) onRetry();
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        }
        onClose={handleClose}
        icon={AlertCircle}
      />
    </div>
  );
}