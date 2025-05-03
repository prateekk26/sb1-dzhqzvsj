import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Trash, Award } from 'lucide-react';
import { ResumeScoreCard } from './ResumeScoreCard';
import { LoadingSpinner, LoadingState } from './LoadingState';
import { ResumeAnalysisResult } from '../hooks/useResumeAnalysis';
import { Button } from './Button';

interface CollapsibleResumeAnalysisProps {
  results: ResumeAnalysisResult;
  userId: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onClear?: () => void;
}

export function CollapsibleResumeAnalysis({ 
  results, 
  userId, 
  onRefresh, 
  isRefreshing,
  onClear
}: CollapsibleResumeAnalysisProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage
  React.useEffect(() => {
    const savedState = localStorage.getItem(`resume_analysis_collapsed_${userId}`);
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, [userId]);

  // Save collapse state to localStorage when it changes
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(`resume_analysis_collapsed_${userId}`, String(newState));
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header - always visible */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Award className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Resume Analysis Results
          </h3>
          <div className="ml-3 px-3 py-1 bg-gray-700 rounded-lg">
            <span className="text-[#FF8A00] font-bold">{results.score.toFixed(1)}</span>
            <span className="text-gray-300">/10</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={Trash}
              onClick={onClear}
              className="text-red-400 hover:bg-red-900/20"
            >
              Clear
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={onRefresh}
              isLoading={isRefreshing}
              className="text-blue-400 border-blue-500/30 hover:bg-blue-900/20"
            >
              Refresh
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-9 w-9 p-0 rounded-lg flex items-center justify-center"
          >
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible content */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? 'max-h-0 opacity-0 overflow-hidden' 
            : 'max-h-[5000px] opacity-100'
        }`}
      >
        <ResumeScoreCard 
          results={results}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          userId={userId}
        />
      </div>
    </div>
  );
}