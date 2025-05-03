import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check, CheckCircle, Edit, Copy, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { useSuggestionsStore } from '../store';
import { Card } from './Card';

interface SuggestionProps {
  originalText: string;
  improvedText: string;
  explanation: string;
  category?: string;
  userId?: string;
  isAccepted?: boolean;
}

export function SuggestionItem({
  originalText,
  improvedText,
  explanation,
  category,
  userId,
  isAccepted = false
}: SuggestionProps) {
  const [copied, setCopied] = useState(false);
  const [isAcceptedState, setIsAcceptedState] = useState(isAccepted);
  const { acceptSuggestion, rejectSuggestion } = useSuggestionsStore();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(improvedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleAccept = () => {
    // Set local state to provide immediate feedback
    setIsAcceptedState(true);
    
    // Call the store action with the suggestion data
    if (userId) {
      acceptSuggestion({
        original: originalText,
        improved: improvedText,
        category
      });
    }
  };
  
  const handleReject = () => {
    if (userId) {
      rejectSuggestion({
        original: originalText,
        improved: improvedText,
        category
      });
    }
  };
  
  return (
    <Card className={`border ${isAcceptedState ? 'border-green-500 bg-green-900/10' : 'border-gray-700'} overflow-hidden transition-all hover:border-[#FF8A00]/30 p-4`}>
      <div className="space-y-3">
        {/* Explanation of issue */}
        {explanation && (
          <p className="text-gray-300 mb-2 text-sm">{explanation}</p>
        )}
        
        {/* Original vs Improved */}
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <div className="flex flex-col space-y-3">
            <div>
              <p className="text-red-400 text-xs uppercase font-semibold mb-1 flex items-center">
                <Edit className="h-3 w-3 mr-1" /> Current Version
              </p>
              <div className="text-gray-300 text-sm italic">"{originalText}"</div>
            </div>
            
            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-gray-500" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-green-400 text-xs uppercase font-semibold flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" /> Improved Version
                </p>
                <button 
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <div className="text-gray-300 text-sm">"{improvedText}"</div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end pt-2 space-x-2">
          {!isAcceptedState ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={ThumbsDown} 
                onClick={handleReject}
                className="text-red-400 hover:bg-red-900/20 border-red-600/20"
              >
                Reject
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                leftIcon={ThumbsUp} 
                onClick={handleAccept}
                className="text-green-400 hover:bg-green-900/20 border-green-600/20"
              >
                Accept
              </Button>
            </>
          ) : (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Accepted
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}