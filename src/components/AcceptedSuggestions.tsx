import React, { useState } from 'react';
import { CheckCircle, Copy, Check, X, Download, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Alert } from './Alert';
import { useSuggestionsStore, Suggestion } from '../store';

interface AcceptedSuggestionsProps {
  userId: string;
  onClose?: () => void;
}

export function AcceptedSuggestions({ userId, onClose }: AcceptedSuggestionsProps) {
  const { getAcceptedSuggestions, markAsIncorporated, markAllAsIncorporated, clearAllSuggestions } = useSuggestionsStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const acceptedSuggestions = getAcceptedSuggestions();
  
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  const handleMarkIncorporated = (original: string) => {
    markAsIncorporated(original);
  };
  
  const handleMarkAllIncorporated = () => {
    markAllAsIncorporated();
  };
  
  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all suggestions? This cannot be undone.")) {
      clearAllSuggestions();
      if (onClose) onClose();
    }
  };
  
  const downloadAsTxt = () => {
    // Create text content with all suggestions
    const textContent = acceptedSuggestions.map(suggestion => {
      return `ORIGINAL: "${suggestion.original}"\nIMPROVED: "${suggestion.improved}"\n\n`;
    }).join('');
    
    // Create and download file
    const element = document.createElement('a');
    const file = new Blob([textContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `resume-improvements-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Group suggestions by category
  const groupedSuggestions: Record<string, Suggestion[]> = {};
  acceptedSuggestions.forEach(suggestion => {
    const category = suggestion.category || 'General';
    if (!groupedSuggestions[category]) {
      groupedSuggestions[category] = [];
    }
    groupedSuggestions[category].push(suggestion);
  });
  
  if (acceptedSuggestions.length === 0) {
    return (
      <Card className="border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-[#FF8A00]" />
              Accepted Improvements
            </span>
            {onClose && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">No accepted suggestions yet</h3>
            <p className="text-gray-400">When you accept resume improvement suggestions, they'll appear here for easy reference.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Accepted Improvements ({acceptedSuggestions.length})
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={downloadAsTxt}
              className="text-blue-400 border-blue-500/30 hover:bg-blue-900/20"
            >
              Download
            </Button>
            {onClose && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert
          variant="info"
          message="These are your accepted improvement suggestions. Mark them as incorporated once you've updated your resume."
        />
        
        {Object.entries(groupedSuggestions).map(([category, suggestions]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-white font-medium border-b border-gray-700 pb-2">{category}</h3>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-[#FF8A00]/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium text-sm">Improvement #{index + 1}</h4>
                  <button 
                    className="text-gray-400 hover:text-green-400 transition"
                    onClick={() => handleMarkIncorporated(suggestion.original)}
                    title="Mark as incorporated"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="bg-gray-750 p-3 rounded-lg border border-gray-700">
                  <div className="space-y-3">
                    <div>
                      <p className="text-red-400 text-xs uppercase font-semibold mb-1">Current</p>
                      <p className="text-gray-300 text-sm italic">"{suggestion.original}"</p>
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="h-5 w-5 text-gray-500" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-green-400 text-xs uppercase font-semibold">Improved</p>
                        <button 
                          className="text-gray-400 hover:text-white transition p-1 rounded"
                          onClick={() => handleCopy(suggestion.improved, index)}
                          title="Copy to clipboard"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-white text-sm">"{suggestion.improved}"</p>
                    </div>
                </div>
              </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
      <CardFooter className="border-t border-gray-700 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="text-red-400 border-red-500/30 hover:bg-red-900/20"
        >
          Clear All Suggestions
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={CheckCircle}
          onClick={handleMarkAllIncorporated}
          className="text-green-400 border-green-500/30 hover:bg-green-900/20"
        >
          Mark All as Incorporated
        </Button>
      </CardFooter>
    </Card>
  );
}