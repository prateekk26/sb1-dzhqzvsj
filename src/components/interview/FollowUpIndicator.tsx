import React from 'react';
import { MessageSquare, HelpCircle, Lightbulb } from 'lucide-react';
import { Alert } from '../Alert';

interface FollowUpIndicatorProps {
  type: 'clarification' | 'deeper_dive';
  currentCount: number;
  maxCount: number;
}

export function FollowUpIndicator({ type, currentCount, maxCount }: FollowUpIndicatorProps) {
  // Choose icon based on follow-up type
  const FollowUpIcon = type === 'clarification' ? HelpCircle : Lightbulb;
  
  // Choose title and description based on follow-up type
  const title = type === 'clarification' 
    ? 'Clarification Needed' 
    : 'Diving Deeper';
  
  const description = type === 'clarification'
    ? 'The interviewer is asking you to clarify part of your previous answer.'
    : 'The interviewer wants you to provide more detail or examples about your experience.';
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`p-1 rounded-full ${type === 'clarification' ? 'bg-blue-900/30' : 'bg-purple-900/30'}`}>
            <FollowUpIcon className={`h-4 w-4 ${type === 'clarification' ? 'text-blue-400' : 'text-purple-400'}`} />
          </div>
          <span className={`text-sm font-medium ${type === 'clarification' ? 'text-blue-400' : 'text-purple-400'}`}>
            {title}
          </span>
        </div>
        
        <span className="text-gray-400 text-xs">
          Follow-up {currentCount} of {maxCount}
        </span>
      </div>
      
      <Alert
        variant="info"
        message={description}
        className="mt-2"
        icon={MessageSquare}
      />
    </div>
  );
}