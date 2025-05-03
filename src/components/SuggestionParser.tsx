import React from 'react';
import { AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { useSuggestionsStore } from '../store';
import { SuggestionItem } from './SuggestionItem';

interface SuggestionParserProps {
  suggestion: string | any;
  category?: string;
  userId?: string | null;
}

// Helper function to parse suggestion text
export function parseSuggestion(suggestion: string | any): { original: string; improved: string; explanation: string } | null {
  // Check if it's already properly formatted
  if (suggestion && typeof suggestion === 'object' && 
      'original' in suggestion && 
      'improved' in suggestion) {
    return {
      original: suggestion.original,
      improved: suggestion.improved,
      explanation: suggestion.explanation || 'No explanation provided'
    };
  }
  
  // If it's not a string, return null
  if (typeof suggestion !== 'string') {
    return null;
  }

  // Simple parsing for demonstration
  let parts = suggestion.split(' should be ');
  if (parts.length === 2) {
    return {
      original: parts[0].replace(/"/g, '').trim(),
      improved: parts[1].replace(/"/g, '').trim(),
      explanation: suggestion
    };
  }
  
  // Another common pattern
  parts = suggestion.split(' instead of ');
  if (parts.length === 2) {
    return {
      original: parts[1].replace(/"/g, '').trim(),
      improved: parts[0].replace(/"/g, '').trim(),
      explanation: suggestion
    };
  }

  // Just return the full suggestion as both parts
  return {
    original: suggestion,
    improved: suggestion,
    explanation: suggestion
  };
}

export function SuggestionParser({ suggestion, category, userId }: SuggestionParserProps) {
  // Get the suggestions store
  const { 
    isSuggestionRejected
  } = useSuggestionsStore(userId || '');
  
  // If there's no userId, just render the suggestion as text
  if (!userId) {
    return (
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-[#FF8A00]/30 transition-colors">
        <div className="flex items-start">
          <Sparkles className="h-4 w-4 text-[#FF8A00] mt-1 mr-2" />
          <div>
            {typeof suggestion === 'string' ? (
              <p className="text-gray-300">{suggestion}</p>
            ) : (
              <>
                <p className="text-gray-300">{suggestion.explanation || 'Improvement suggestion'}</p>
                {suggestion.original !== suggestion.improved && (
                  <div className="mt-2 bg-gray-700/50 p-2 rounded">
                    <p className="text-xs text-red-400 mb-1">Current:</p>
                    <p className="text-sm text-gray-300 italic">"{suggestion.original}"</p>
                    <p className="text-xs text-green-400 mt-2 mb-1">Improved:</p>
                    <p className="text-sm text-green-300">"{suggestion.improved}"</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Parse the suggestion
  const parsed = parseSuggestion(suggestion);
  
  // If we couldn't parse it, just render the original text
  if (!parsed) {
    return (
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-[#FF8A00]/30 transition-colors">
        <div className="flex items-start">
          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-1 mr-2" />
          <p className="ml-2 text-gray-300">{typeof suggestion === 'string' ? suggestion : 'Unknown suggestion format'}</p>
        </div>
      </div>
    );
  }
  
  // Check if this suggestion has been rejected already
  const isRejected = isSuggestionRejected(parsed);
  
  // If it's already rejected, just show it as text
  if (isRejected) {
    return (
      <div className="bg-gray-800 p-3 rounded-lg border border-red-700/30 hover:border-[#FF8A00]/30 transition-colors opacity-60">
        <div className="flex items-start">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-1 mr-2" />
          <div>
            <p className="text-gray-400">{parsed.explanation} <span className="text-red-400 text-xs">(rejected)</span></p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the suggestion item
  return (
    <SuggestionItem
      originalText={parsed.original}
      improvedText={parsed.improved}
      explanation={parsed.explanation}
      category={category}
      userId={userId}
    />
  );
}