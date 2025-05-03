import React, { useState } from 'react';

interface FlippableCardProps {
  children: React.ReactNode;
}

export function FlippableCard({ children }: FlippableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="flip-card relative h-full"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onFocus={() => setIsFlipped(true)}
      onBlur={() => setIsFlipped(false)}
      tabIndex={0}
      role="button"
      aria-pressed={isFlipped}
      aria-label="Hover or focus to see more details."
    >
      <div className={`flip-card-inner w-full h-full transition-transform duration-600 ${isFlipped ? 'flip-card-flipped' : ''}`}>
        {children}
      </div>
    </div>
  );
}