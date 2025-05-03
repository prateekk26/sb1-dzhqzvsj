import React from 'react';
import { Loader, FileText, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { Alert } from './Alert';

export interface LoadingStateProps {
  text?: string;
  icon?: React.ReactNode;
  showSpinner?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function LoadingState({ text = 'Loading...', icon, showSpinner = true, error, onRetry }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-[#0F121A] flex items-center justify-center">
      <div className="flex flex-col items-center max-w-md w-full px-4">
        {error ? (
          <div className="w-full">
            <div className="mb-6">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
            </div>
            <Alert
              variant="error"
              message={error}
              className="mb-4"
            />
            {onRetry && (
              <Button
                variant="primary"
                leftIcon={RefreshCw}
                onClick={onRetry}
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>
        ) : (
          <>
            {showSpinner && (
              <div className="mb-4">
                {icon || (
                  <div className="h-12 w-12 relative">
                    <div className="absolute h-full w-full border-4 border-gray-600 rounded-full"></div>
                    <div className="absolute h-full w-full border-4 border-[#FF8A00] rounded-full animate-spin border-t-transparent"></div>
                  </div>
                )}
              </div>
            )}
            <p className="mt-4 text-white text-center">{text}</p>
          </>
        )}
      </div>
    </div>
  );
}

// For smaller loading indicators
export function LoadingSpinner({ 
  className = '', 
  size = 'default',
  color = 'primary'
}: { 
  className?: string; 
  size?: 'small' | 'default' | 'large';
  color?: 'primary' | 'white' | 'gray';
}) {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    default: 'h-6 w-6 border-2',
    large: 'h-10 w-10 border-3'
  };
  
  const colorClasses = {
    primary: 'border-[#FF8A00]',
    white: 'border-white',
    gray: 'border-gray-400'
  };
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div className={`absolute h-full w-full border-2 border-gray-600 rounded-full`}></div>
        <div className={`absolute h-full w-full border-2 ${colorClasses[color]} rounded-full animate-spin border-t-transparent`}></div>
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div 
      className={`bg-gray-700 animate-pulse rounded ${className}`}
      style={{ 
        width: width ? width : undefined,
        height: height ? height : undefined
      }}
    ></div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-8 w-full max-w-2xl">
      <Skeleton className="h-8 w-1/2 mb-6" />
      
      <div className="space-y-6">
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
        
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
        
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
        
        <div>
          <Skeleton className="h-5 w-1/4 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/**
 * Component to display a loading state with a message and icon
 */
export function ContentLoading({
  message = 'Loading content...', 
  icon, 
  className = '',
  error,
  onRetry
}: { 
  message?: string; 
  icon?: React.ReactNode; 
  className?: string;
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 w-full ${className}`}>
      {error ? (
        <div className="w-full max-w-md">
          <div className="mb-4">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          </div>
          <Alert
            variant="error"
            message={error}
            className="mb-4"
          />
          {onRetry && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                leftIcon={RefreshCw}
                onClick={onRetry}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4">
            {icon || <Loader className="h-8 w-8 text-[#FF8A00] animate-spin" />}
          </div>
          <p className="text-gray-300 text-center">{message}</p>
        </>
      )}
    </div>
  );
}

/**
 * Component to display a loading state for file operations
 */
export function FileLoading({
  fileName, 
  operation = 'loading', 
  className = '',
  error,
  onRetry,
  onCancel
}: { 
  fileName: string; 
  operation?: 'loading' | 'uploading' | 'processing';
  className?: string;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}) {
  const getIcon = () => {
    switch (operation) {
      case 'uploading':
        return <FileText className="h-8 w-8 text-blue-400" />;
      case 'processing':
        return <FileText className="h-8 w-8 text-[#FF8A00]" />;
      default:
        return <FileText className="h-8 w-8 text-gray-400" />;
    }
  };
  
  const getMessage = () => {
    switch (operation) {
      case 'uploading':
        return `Uploading ${fileName}...`;
      case 'processing':
        return `Processing ${fileName}...`;
      default:
        return `Loading ${fileName}...`;
    }
  };
  
  return (
    <div className={`flex flex-col items-center justify-center py-8 w-full ${className}`}>
      {error ? (
        <div className="w-full max-w-md">
          <div className="mb-4">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          </div>
          <Alert
            variant="error"
            message={`Error ${operation === 'uploading' ? 'uploading' : operation === 'processing' ? 'processing' : 'loading'} ${fileName}: ${error}`}
            className="mb-4"
          />
          <div className="flex justify-center space-x-3">
            {onRetry && (
              <Button
                variant="outline"
                leftIcon={RefreshCw}
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="relative mb-4">
            {getIcon()}
            <div className="absolute bottom-0 right-0">
              <div className="h-4 w-4 bg-gray-800 rounded-full p-0.5">
                <Loader className="h-3 w-3 text-[#FF8A00] animate-spin" />
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-center">{getMessage()}</p>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="mt-3"
            >
              Cancel
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Component to display a timeout or error state
 */
export function TimeoutError({
  message = 'Operation timed out',
  onRetry,
  className = ''
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
      <p className="text-red-300 text-center font-medium mb-2">{message}</p>
      <p className="text-gray-400 text-sm text-center mb-4">
        This operation is taking longer than expected. Please try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
        >
          <Clock className="h-4 w-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
}