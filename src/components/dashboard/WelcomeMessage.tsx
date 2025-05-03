import React, { memo } from 'react';

interface WelcomeMessageProps {
  displayName: string;
}

// Memoize the WelcomeMessage component to prevent unnecessary re-renders
export const WelcomeMessage = memo(function WelcomeMessage({ displayName }: WelcomeMessageProps) {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-white mb-2">
        Welcome, {displayName}!
      </h1>
      <p className="text-gray-400">
        Your smart interview prep starts here
      </p>
    </div>
  );
});