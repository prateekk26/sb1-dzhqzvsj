import React from 'react';
import { Alert } from '../Alert';

interface ErrorDisplayProps {
  error: string | null;
  detailedError: string | null;
  onClose: () => void;
}

export function ErrorDisplay({ error, detailedError, onClose }: ErrorDisplayProps) {
  if (!error) return null;
  
  return (
    <Alert 
      variant="error" 
      message={
        <div>
          <p>{error}</p>
          {detailedError && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-400">Technical Details</summary>
              <pre className="mt-2 p-2 bg-gray-800 rounded text-xs whitespace-pre-wrap text-gray-300 max-h-40 overflow-auto">
                {detailedError}
              </pre>
            </details>
          )}
        </div>
      }
      onClose={onClose}
      className="mb-6"
    />
  );
}