import React from 'react';
import { Alert } from './Alert';
import { AlertTriangle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  detailedError: string | null;
  onClose: () => void;
  title?: string;
  variant?: 'error' | 'warning';
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  detailedError, 
  onClose, 
  title = 'Error', 
  variant = 'error',
  className = ''
}: ErrorDisplayProps) {
  if (!error) return null;
  
  return (
    <Alert 
      variant={variant}
      title={title}
      message={
        <div>
          <p>{error}</p>
          {detailedError && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-gray-800 rounded text-xs whitespace-pre-wrap text-gray-300 max-h-40 overflow-auto border border-gray-700">
                {detailedError}
              </pre>
            </details>
          )}
        </div>
      }
      onClose={onClose}
      className={`mb-6 ${className}`}
      icon={AlertTriangle}
    />
  );
}