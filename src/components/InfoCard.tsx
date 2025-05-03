import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  stepNumber: number;
  extendedDescription?: string;
}

export function InfoCard({
  icon: Icon,
  title,
  description,
  stepNumber,
  extendedDescription,
}: InfoCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="flip-card group relative"
      style={{ height: '400px' }}
      tabIndex={0}
      role="button"
      aria-label={`${title}: ${description}`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onFocus={() => setIsFlipped(true)}
      onBlur={() => setIsFlipped(false)}
    >
      <div className={`flip-card-inner transition-transform duration-600 ${isFlipped ? 'flip-card-flipped' : ''}`}>
        {/* Front of Card */}
        <div className="flip-card-front bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 flex flex-col relative">
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-gray-700 via-gray-600 to-[#FF8A00]/30 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Step number */}
          <div className="flex justify-end mb-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700/50 border border-gray-600 group-hover:border-[#FF8A00]/50 transition-colors">
              <span className="text-[#FF8A00] font-semibold text-lg">{stepNumber}</span>
            </div>
          </div>

          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-lg bg-gray-700/50 border border-gray-600 group-hover:border-[#FF8A00]/30 group-hover:bg-[#FF8A00]/5 transition-all duration-300">
              <Icon className="h-7 w-7 text-[#FF8A00]" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#FF8A00] transition-colors duration-300">
            {title}
          </h3>

          {/* Short description */}
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {description}
          </p>

          {/* Divider */}
          <div className="w-16 h-0.5 bg-[#FF8A00]/50 mb-4"></div>

          {/* Hint */}
          <div className="mt-auto text-center">
            <span className="text-xs text-[#FF8A00]/70">
              Hover for details
            </span>
          </div>
        </div>

        {/* Back of Card */}
        <div className="flip-card-back bg-gray-800/95 rounded-xl p-6 flex flex-col relative">
          {/* Gradient border */}
          <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-[#FF8A00]/30 via-gray-600 to-gray-700 opacity-100 transition-opacity duration-300 -z-10" />

          {/* Step number */}
          <div className="flex justify-end mb-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FF8A00]/20 border border-[#FF8A00]/50 transition-colors">
              <span className="text-[#FF8A00] font-semibold text-lg">{stepNumber}</span>
            </div>
          </div>

          {/* Title again */}
          <h3 className="text-xl font-semibold text-[#FF8A00] mb-4">
            {title}
          </h3>

          {/* Extended Description */}
          {extendedDescription && (
            <p className="text-white text-sm leading-relaxed">
              {extendedDescription}
            </p>
          )}

          {/* Hint */}
          <div className="mt-auto text-center">
            <span className="text-xs text-[#FF8A00] font-medium">
              Release to go back
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}