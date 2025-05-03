import { useState, useEffect, useCallback } from 'react';

export interface Suggestion {
  original: string;
  improved: string;
  category?: string;
  timestamp: number;
  accepted: boolean;
  rejected?: boolean;
  incorporated: boolean;
}

const STORAGE_KEY = 'resumeSuggestions';

export function useSuggestionsStore(userId: string | null) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const storageKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
  
  // Load suggestions from local storage
  useEffect(() => {
    if (!userId) return;
    
    const savedSuggestions = localStorage.getItem(storageKey);
    if (savedSuggestions) {
      try {
        setSuggestions(JSON.parse(savedSuggestions));
      } catch (e) {
        console.error('Error loading saved suggestions:', e);
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey, userId]);
  
  // Save suggestions to local storage whenever they change
  useEffect(() => {
    if (suggestions.length > 0 && userId) {
      localStorage.setItem(storageKey, JSON.stringify(suggestions));
    }
  }, [suggestions, storageKey, userId]);
  
  // Add or update a suggestion
  const addSuggestion = useCallback((suggestion: Omit<Suggestion, 'timestamp' | 'accepted' | 'rejected' | 'incorporated'>) => {
    if (!userId) return;
    
    setSuggestions(prev => {
      // Check if suggestion with same original text exists
      const existingIndex = prev.findIndex(s => s.original === suggestion.original);
      
      if (existingIndex >= 0) {
        // Update existing suggestion
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...suggestion,
          timestamp: Date.now()
        };
        return updated;
      } else {
        // Add new suggestion
        return [...prev, {
          ...suggestion,
          timestamp: Date.now(),
          accepted: false,
          rejected: false,
          incorporated: false
        }];
      }
    });
  }, [userId]);
  
  // Accept a suggestion
  const acceptSuggestion = useCallback((suggestion: Omit<Suggestion, 'timestamp' | 'accepted' | 'rejected' | 'incorporated'>) => {
    if (!userId) return;
    
    console.log('Accepting suggestion:', suggestion);
    
    setSuggestions(prev => {
      const existingIndex = prev.findIndex(s => s.original === suggestion.original && s.improved === suggestion.improved);
      
      if (existingIndex >= 0) {
        // Update existing suggestion
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...suggestion,
          timestamp: Date.now(),
          accepted: true,
          rejected: false
        };
        return updated;
      } else {
        // Add new accepted suggestion
        return [...prev, {
          ...suggestion,
          timestamp: Date.now(),
          accepted: true,
          rejected: false,
          incorporated: false
        }];
      }
    });
  }, [userId]);
  
  // Reject a suggestion
  const rejectSuggestion = useCallback((suggestion: Omit<Suggestion, 'timestamp' | 'accepted' | 'rejected' | 'incorporated'>) => {
    if (!userId) return;
    
    setSuggestions(prev => {
      const existingIndex = prev.findIndex(s => s.original === suggestion.original && s.improved === suggestion.improved);
      
      if (existingIndex >= 0) {
        // If it exists, mark it as rejected and not accepted
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...suggestion,
          timestamp: Date.now(),
          accepted: false,
          rejected: true
        };
        return updated;
      } else {
        // If it doesn't exist, add it as a rejected suggestion
        return [...prev, {
          ...suggestion,
          timestamp: Date.now(),
          accepted: false,
          rejected: true,
          incorporated: false
        }];
      }
    });
  }, [userId]);
  
  // Mark suggestion as incorporated
  const markAsIncorporated = useCallback((original: string) => {
    if (!userId) return;
    
    setSuggestions(prev => {
      return prev.map(s => {
        if (s.original === original) {
          return { ...s, incorporated: true };
        }
        return s;
      });
    });
  }, [userId]);
  
  // Mark all suggestions as incorporated
  const markAllAsIncorporated = useCallback(() => {
    if (!userId) return;
    
    setSuggestions(prev => {
      return prev.map(s => ({ ...s, incorporated: true }));
    });
  }, [userId]);
  
  // Get all accepted suggestions
  const getAcceptedSuggestions = useCallback(() => {
    return suggestions.filter(s => s.accepted && !s.incorporated);
  }, [suggestions]);
  
  // Get rejected suggestions
  const getRejectedSuggestions = useCallback(() => {
    return suggestions.filter(s => s.rejected === true);
  }, [suggestions]);
  
  // Check if a suggestion is rejected
  const isSuggestionRejected = useCallback((suggestion: Omit<Suggestion, 'timestamp' | 'accepted' | 'rejected' | 'incorporated'>) => {
    return suggestions.some(s => 
      s.original === suggestion.original && 
      s.improved === suggestion.improved && 
      s.rejected === true
    );
  }, [suggestions]);
  
  // Clear all suggestions
  const clearAllSuggestions = useCallback(() => {
    if (!userId) return;
    
    setSuggestions([]);
    localStorage.removeItem(storageKey);
  }, [storageKey, userId]);
  
  return {
    suggestions,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    markAsIncorporated,
    markAllAsIncorporated,
    getAcceptedSuggestions,
    getRejectedSuggestions,
    isSuggestionRejected,
    clearAllSuggestions,
    acceptedCount: suggestions.filter(s => s.accepted && !s.incorporated).length
  };
}