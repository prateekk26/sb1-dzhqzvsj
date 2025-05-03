import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon, AlertTriangle } from 'lucide-react';
import { Button } from '../Button';

interface SessionTimerProps {
  totalSeconds: number;
  active: boolean;
  onTimeUp?: () => void;
  onTimeWarning?: () => void;
  warningThreshold?: number; // percentage of time remaining (e.g., 20 means 20% time left)
  className?: string;
}

export function SessionTimer({
  totalSeconds,
  active,
  onTimeUp,
  onTimeWarning,
  warningThreshold = 20,
  className = ''
}: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [showWarning, setShowWarning] = useState(false);
  const [warningTriggered, setWarningTriggered] = useState(false);

  useEffect(() => {
    setRemainingSeconds(totalSeconds);
    setShowWarning(false);
    setWarningTriggered(false);
  }, [totalSeconds]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (active && remainingSeconds > 0) {
      timerId = setInterval(() => {
        setRemainingSeconds(prev => {
          const newValue = prev - 1;
          
          // Check if we need to show a warning
          const percentageRemaining = (newValue / totalSeconds) * 100;
          if (percentageRemaining <= warningThreshold && !warningTriggered) {
            setShowWarning(true);
            setWarningTriggered(true);
            if (onTimeWarning) onTimeWarning();
          }
          
          // Check if time is up
          if (newValue <= 0) {
            if (onTimeUp) onTimeUp();
            clearInterval(timerId);
            return 0;
          }
          
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [active, remainingSeconds, onTimeUp, onTimeWarning, totalSeconds, warningThreshold, warningTriggered]);

  // Format the time as MM:SS
  const formatTime = () => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = Math.max(0, (remainingSeconds / totalSeconds) * 100);
  
  // Determine color based on time left
  const getProgressColor = () => {
    if (progressPercentage > 50) return 'bg-green-500';
    if (progressPercentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-white">
          <TimerIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-mono">{formatTime()}</span>
        </div>
        
        {showWarning && (
          <div className="flex items-center text-yellow-400 animate-pulse">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Session time running low</span>
          </div>
        )}
      </div>
      
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-1000 ease-linear`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}