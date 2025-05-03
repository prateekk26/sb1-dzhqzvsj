import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  onWarning?: () => void;
  warningThreshold?: number; // in seconds
  active: boolean;
  className?: string;
  showMinutesSeconds?: boolean;
}

export function Timer({
  duration,
  onTimeUp,
  onWarning,
  warningThreshold,
  active,
  className = '',
  showMinutesSeconds = false
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTriggeredRef = useRef(false);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeLeft(duration);
    warningTriggeredRef.current = false;
    setShowWarning(false);
  }, [duration]);

  useEffect(() => {
    // Start or stop timer based on active state
    if (active) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          
          // Check if we need to show a warning
          if (warningThreshold && 
              newTime <= warningThreshold && 
              newTime > 0 && 
              !warningTriggeredRef.current) {
            setShowWarning(true);
            warningTriggeredRef.current = true;
            if (onWarning) onWarning();
          }
          
          // Check if time is up
          if (newTime <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (onTimeUp) onTimeUp();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      // Clear any existing interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    // Cleanup on unmount or when active changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [active, onTimeUp, onWarning, warningThreshold]);

  // Format time as minutes:seconds or as a percentage
  const formatTime = () => {
    if (showMinutesSeconds) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      const percentage = Math.max(0, Math.round((timeLeft / duration) * 100));
      return `${percentage}%`;
    }
  };

  // Determine color based on time left
  const getColorClass = () => {
    const percentage = (timeLeft / duration) * 100;
    
    if (percentage > 50) return 'text-green-400';
    if (percentage > 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-mono ${getColorClass()} flex items-center`}>
        <Clock className="h-4 w-4 mr-2" />
        {formatTime()}
      </div>
      
      {showWarning && (
        <div className="ml-3 text-yellow-400 flex items-center animate-pulse">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span className="text-xs">Time running out</span>
        </div>
      )}
    </div>
  );
}