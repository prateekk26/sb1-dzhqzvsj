import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertTriangle, RefreshCw, Clock, FileText, Sparkles, Upload, Database, Search, X } from 'lucide-react';
import { Button } from './Button';
import { Alert } from './Alert';

// Types for the loading indicators
export type LoadingStage = 'initial' | 'processing' | 'analyzing' | 'finalizing' | 'complete' | 'error';
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingStageInfo {
  message: string;
  icon: React.ReactNode;
  estimatedTime?: number; // in seconds
}

interface LoadingIndicatorProps {
  /**
   * Current loading stage
   */
  stage: LoadingStage;
  /**
   * Custom message to display (overrides default stage message)
   */
  message?: string;
  /**
   * Size of the loading indicator
   */
  size?: LoadingSize;
  /**
   * Error message to display if stage is 'error'
   */
  error?: string;
  /**
   * Callback for retry button
   */
  onRetry?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Start time of the loading process (for time estimation)
   */
  startTime?: number;
  /**
   * Total stages in the process (for progress calculation)
   */
  totalStages?: number;
  /**
   * Current stage number (for progress calculation)
   */
  currentStageNumber?: number;
  /**
   * Whether to show the progress bar
   */
  showProgress?: boolean;
}

/**
 * Full-screen loading indicator that covers the entire viewport
 */
export function FullScreenLoading({
  message = 'Loading...',
  icon = <Loader className="h-10 w-10 text-[#FF8A00] animate-spin" />,
}: {
  message?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-[#0F121A]/90 flex items-center justify-center z-50 animate-fadeIn">
      <div className="flex flex-col items-center justify-center p-8 rounded-lg">
        <div className="mb-6">{icon}</div>
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  );
}

/**
 * Loading indicator with multiple stages and progress tracking
 */
export function LoadingIndicator({
  stage,
  message,
  size = 'md',
  error,
  onRetry,
  className = '',
  startTime,
  totalStages = 4,
  currentStageNumber = 1,
  showProgress = true,
}: LoadingIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);

  // Default stage information
  const stageInfo: Record<LoadingStage, LoadingStageInfo> = {
    initial: {
      message: 'Preparing to start...',
      icon: <Clock className="text-blue-400 animate-pulse" />,
      estimatedTime: 1
    },
    processing: {
      message: 'Processing your request...',
      icon: <Loader className="text-[#FF8A00] animate-spin" />,
      estimatedTime: 5
    },
    analyzing: {
      message: 'Analyzing data...',
      icon: <Search className="text-blue-400 animate-pulse" />,
      estimatedTime: 10
    },
    finalizing: {
      message: 'Finalizing results...',
      icon: <Sparkles className="text-[#FF8A00] animate-pulse" />,
      estimatedTime: 3
    },
    complete: {
      message: 'Process complete!',
      icon: <CheckCircle className="text-green-400" />,
    },
    error: {
      message: 'An error occurred',
      icon: <AlertTriangle className="text-red-400" />,
    }
  };

  // Size classes for the container and icon
  const sizeClasses = {
    xs: {
      container: 'p-2 text-xs',
      icon: 'h-3 w-3',
      spinner: 'h-3 w-3'
    },
    sm: {
      container: 'p-3 text-sm',
      icon: 'h-4 w-4',
      spinner: 'h-4 w-4'
    },
    md: {
      container: 'p-4 text-base',
      icon: 'h-5 w-5',
      spinner: 'h-5 w-5'
    },
    lg: {
      container: 'p-5 text-lg',
      icon: 'h-6 w-6',
      spinner: 'h-6 w-6'
    },
    xl: {
      container: 'p-6 text-xl',
      icon: 'h-8 w-8',
      spinner: 'h-8 w-8'
    }
  };

  // Calculate time remaining and progress
  useEffect(() => {
    if (stage === 'complete' || stage === 'error') {
      setTimeRemaining(null);
      setProgressPercent(100);
      return;
    }

    if (startTime && stageInfo[stage].estimatedTime) {
      const updateTimeAndProgress = () => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const estimatedTotal = stageInfo[stage].estimatedTime || 0;
        const remaining = Math.max(0, estimatedTotal - elapsedSeconds);
        
        // Calculate progress based on elapsed time and current stage
        const stageProgress = Math.min(100, (elapsedSeconds / estimatedTotal) * 100);
        const overallProgress = ((currentStageNumber - 1) / totalStages * 100) + (stageProgress / totalStages);
        
        setTimeRemaining(remaining);
        setProgressPercent(Math.min(95, overallProgress)); // Cap at 95% until complete
      };

      updateTimeAndProgress();
      const interval = setInterval(updateTimeAndProgress, 1000);
      return () => clearInterval(interval);
    }
  }, [stage, startTime, currentStageNumber, totalStages]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)} seconds`;
    }
    return `${Math.ceil(seconds / 60)} minutes`;
  };

  // Get current stage info
  const currentStage = stageInfo[stage];
  const displayMessage = message || currentStage.message;
  const displayIcon = React.cloneElement(
    currentStage.icon as React.ReactElement,
    { className: `${sizeClasses[size].icon} ${(currentStage.icon as React.ReactElement).props.className || ''}` }
  );

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${sizeClasses[size].container} ${className}`}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">{displayIcon}</div>
        <p className="text-white font-medium mb-3">{displayMessage}</p>
        
        {/* Show error message and retry button if in error state */}
        {stage === 'error' && error && (
          <div className="mt-3 text-center w-full">
            <Alert
              variant="error"
              message={error}
              className="mb-3"
            />
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={RefreshCw}
                onClick={onRetry}
                className="mt-2"
              >
                Try Again
              </Button>
            )}
          </div>
        )}
        
        {/* Show progress bar for active loading states */}
        {showProgress && stage !== 'complete' && stage !== 'error' && (
          <div className="w-full mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1 overflow-hidden">
              <div
                className="bg-[#FF8A00] h-2.5 rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Show time remaining if available */}
            {timeRemaining !== null && timeRemaining > 1 && (
              <p className="text-gray-400 text-xs mt-1">
                Estimated time remaining: ~{formatTimeRemaining(timeRemaining)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline loading indicator for use within components
 */
export function InlineLoading({
  message = 'Loading...',
  size = 'sm',
  className = '',
}: {
  message?: string;
  size?: LoadingSize;
  className?: string;
}) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7'
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
      <Loader className={`${iconSizes[size]} text-[#FF8A00] animate-spin mr-2`} />
      <span className="text-gray-300">{message}</span>
    </div>
  );
}

/**
 * Progress indicator for multi-step processes
 */
export function ProcessSteps({
  steps,
  currentStep,
  className = '',
}: {
  steps: { name: string; description?: string; icon?: React.ReactNode }[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        return (
          <div 
            key={index}
            className={`flex items-start p-3 rounded-lg transition-colors ${
              isActive 
                ? 'bg-[#FF8A00]/10 border border-[#FF8A00]/30' 
                : isCompleted 
                  ? 'bg-green-900/10 border border-green-500/30' 
                  : 'bg-gray-800 border border-gray-700'
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
              isActive 
                ? 'bg-[#FF8A00]/20 text-[#FF8A00]' 
                : isCompleted 
                  ? 'bg-green-900/20 text-green-400' 
                  : 'bg-gray-700 text-gray-400'
            }`}>
              {isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : step.icon || (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className={`font-medium ${
                isActive 
                  ? 'text-[#FF8A00]' 
                  : isCompleted 
                    ? 'text-green-400' 
                    : 'text-gray-300'
              }`}>
                {step.name}
              </h4>
              {step.description && (
                <p className="text-sm text-gray-400 mt-1">{step.description}</p>
              )}
              
              {isActive && (
                <div className="mt-2 flex items-center text-[#FF8A00]/80">
                  <Loader className="h-3 w-3 animate-spin mr-2" />
                  <span className="text-xs">In progress...</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Specialized loading indicator for file uploads
 */
export function UploadingIndicator({
  fileName,
  progress,
  size = 'md',
  onCancel,
  className = '',
}: {
  fileName: string;
  progress: number; // 0-100
  size?: LoadingSize;
  onCancel?: () => void;
  className?: string;
}) {
  const sizeClasses = {
    xs: 'p-2 text-xs',
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-5 text-lg',
    xl: 'p-6 text-xl'
  };

  return (
    progress > 0 && (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center mb-2">
        <Upload className="text-[#FF8A00] mr-2 h-5 w-5" />
        <span className="text-white font-medium">Uploading {fileName}</span>
      </div>
      <div className="flex justify-between items-center">
        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
          <div
            className="bg-[#FF8A00] h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {progress < 100 && onCancel && (
          <button 
            onClick={onCancel} 
            className="ml-2 text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-700"
            aria-label="Cancel upload"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <p className="text-gray-400 text-xs mt-1 text-right">{Math.round(progress)}%</p>
    </div>
    )
  );
}

/**
 * Loading indicator for data processing with animated steps
 */
export function ProcessingIndicator({
  title = 'Processing Data',
  steps,
  currentStep,
  error,
  onRetry,
  className = '',
}: {
  title?: string;
  steps: { name: string; description?: string; icon?: React.ReactNode }[];
  currentStep: number;
  error?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-5 ${className}`}>
      <h3 className="text-white font-medium text-lg mb-4 flex items-center">
        {currentStep < steps.length ? (
          <Loader className="h-5 w-5 text-[#FF8A00] animate-spin mr-2" />
        ) : error ? (
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
        )}
        {title}
      </h3>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${
            error ? 'bg-red-500' : currentStep >= steps.length ? 'bg-green-500' : 'bg-[#FF8A00]'
          }`}
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        ></div>
      </div>
      
      {/* Steps */}
      <div className="space-y-3 mt-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isPending = index > currentStep;
          
          return (
            <div 
              key={index}
              className={`flex items-center p-2 rounded transition-colors ${
                isActive 
                  ? 'bg-[#FF8A00]/10' 
                  : isCompleted 
                    ? 'bg-green-900/10' 
                    : 'bg-gray-700/30'
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                isActive 
                  ? 'bg-[#FF8A00]/20 text-[#FF8A00]' 
                  : isCompleted 
                    ? 'bg-green-900/20 text-green-400' 
                    : 'bg-gray-700 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isActive ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  isActive 
                    ? 'text-[#FF8A00]' 
                    : isCompleted 
                      ? 'text-green-400' 
                      : isPending 
                        ? 'text-gray-400' 
                        : 'text-white'
                }`}>
                  {step.name}
                </p>
                {step.description && isActive && (
                  <p className="text-xs text-gray-400 mt-1 animate-fadeIn">{step.description}</p>
                )}
              </div>
              
              {isActive && (
                <div className="text-xs text-[#FF8A00] animate-pulse">
                  In progress...
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Error message and retry button */}
      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-center">
          <Alert
            variant="error"
            message={error}
            className="mb-2"
          />
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={onRetry}
              className="mt-1"
            >
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Specialized loading indicator for AI operations
 */
export function AIProcessingIndicator({
  message = 'AI is processing your request...',
  subMessage,
  progress = 0,
  error,
  onRetry,
  className = '',
}: {
  message?: string;
  subMessage?: string;
  progress?: number; // 0-100
  error?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      {error ? (
        <div className="mb-4">
          <AlertTriangle className="h-16 w-16 text-red-400 animate-pulse" />
        </div>
      ) : (
        <div className="relative h-16 w-16 mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-[#FF8A00]/20 border-t-[#FF8A00] animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-[#FF8A00] animate-pulse" />
          </div>
        </div>
      )}
      
      <h3 className="text-white font-medium text-lg mb-2">{error ? 'Processing Error' : message}</h3>
      
      {!error && subMessage && (
        <p className="text-gray-400 text-sm mb-4 max-w-md text-center">{subMessage}</p>
      )}
      
      {error && (
        <div className="mb-4 max-w-md">
          <Alert
            variant="error"
            message={error}
            className="mb-3"
          />
          {onRetry && (
            <Button
              variant="outline"
              leftIcon={RefreshCw}
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
        </div>
      )}
      
      {!error && progress !== undefined && (
        <div className="w-64 mt-2">
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1 overflow-hidden">
            <div
              className="bg-[#FF8A00] h-2.5 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Starting</span>
            <span>Processing</span>
            <span>Finishing</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Loading indicator for database operations
 */
export function DatabaseLoadingIndicator({
  message = 'Loading data...',
  className = '',
  error,
  onRetry,
}: {
  message?: string;
  className?: string;
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      {error ? (
        <div className="bg-gray-800 p-4 rounded-lg border border-red-500/30 max-w-md w-full">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-white font-medium">Error Loading Data</span>
          </div>
          <p className="text-gray-300 mb-3">{error}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={onRetry}
              className="w-full"
            >
              Retry
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center bg-gray-800 px-4 py-3 rounded-lg border border-gray-700">
          <Database className="h-5 w-5 text-[#FF8A00] animate-pulse mr-3" />
          <span className="text-white">{message}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Loading indicator for file operations
 */
export function FileLoadingIndicator({
  fileName,
  operation = 'loading',
  progress = 0,
  error,
  onRetry,
  onCancel,
  className = '',
}: {
  fileName: string;
  operation?: 'loading' | 'uploading' | 'downloading' | 'processing';
  progress?: number; // 0-100
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
}) {
  const getOperationIcon = () => {
    switch (operation) {
      case 'uploading':
        return <Upload className="h-5 w-5 text-[#FF8A00] animate-pulse" />;
      case 'downloading':
        return <FileText className="h-5 w-5 text-[#FF8A00] animate-pulse" />;
      case 'processing':
        return <Sparkles className="h-5 w-5 text-[#FF8A00] animate-pulse" />;
      default:
        return <Loader className="h-5 w-5 text-[#FF8A00] animate-spin" />;
    }
  };

  const getOperationText = () => {
    switch (operation) {
      case 'uploading':
        return 'Uploading';
      case 'downloading':
        return 'Downloading';
      case 'processing':
        return 'Processing';
      default:
        return 'Loading';
    }
  };

  return (
    <div className={`bg-gray-800 border ${error ? 'border-red-500/30' : 'border-gray-700'} rounded-lg p-3 ${className}`}>
      {error ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-white font-medium">Error {getOperationText().toLowerCase()} {fileName}</span>
            </div>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-gray-300 text-sm">{error}</p>
          <div className="flex justify-end space-x-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={RefreshCw}
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {getOperationIcon()}
              <span className="text-white font-medium ml-2">
                {getOperationText()} {fileName}
              </span>
            </div>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {progress !== undefined && (
            <>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1 overflow-hidden">
                <div
                  className="bg-[#FF8A00] h-2.5 rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-400 text-xs text-right">{Math.round(progress)}%</p>
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Button with loading state
 */
export function LoadingButton({
  isLoading = false,
  children,
  loadingText = 'Loading...',
  loadingIcon = Loader,
  ...props
}: React.ComponentProps<typeof Button> & {
  isLoading: boolean;
  loadingText?: string;
  loadingIcon?: LucideIcon;
}) {
  const LoadingIcon = loadingIcon;
  
  return (
    <Button
      {...props}
      disabled={isLoading || props.disabled}
    >
      {isLoading ? (
        <>
          <LoadingIcon className="h-4 w-4 animate-spin mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}