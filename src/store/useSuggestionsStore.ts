import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Suggestion {
  original: string;
  improved: string;
  category?: string;
  timestamp: number;
  accepted: boolean;
  rejected?: boolean;
  incorporated: boolean;
}

interface SuggestionsState {
  suggestions: Suggestion[];
  acceptedCount: number;
}

interface SuggestionsActions {
  addSuggestion: (suggestion: Omit<Suggestion, 'timestamp' | 'accepted' | 'rejected' | 'incorporated'>) => void;
  acceptSuggestion: (suggestion: Omit<Suggestion, 'timestamp' | 'accepted' | 'rejected' | 'incorporated'>) => void;
  rejectSuggestion: (suggestion: Omit<Suggestion, 'timestamp' | 'accepted' | 'rejected' | 'incorporated'>) => void;
  markAsIncorporated: (original: string) => void;
  markAllAsIncorporated: () => void;
  getAcceptedSuggestions: () => Suggestion[];
  getRejectedSuggestions: () => Suggestion[];
  isSuggestionRejected: (suggestion: Omit<Suggestion, 'timestamp' | 'accepted' | 'rejected' | 'incorporated'>) => boolean;
  clearAllSuggestions: () => void;
}

export const useSuggestionsStore = create<SuggestionsState & SuggestionsActions>()(
  persist(
    (set, get) => ({
      suggestions: [],
      acceptedCount: 0,
      
      addSuggestion: (suggestion) => set((state) => {
        // Check if suggestion with same original text exists
        const existingIndex = state.suggestions.findIndex(s => s.original === suggestion.original);
        
        if (existingIndex >= 0) {
          // Update existing suggestion
          const updated = [...state.suggestions];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...suggestion,
            timestamp: Date.now()
          };
          return { suggestions: updated };
        } else {
          // Add new suggestion
          return { 
            suggestions: [
              ...state.suggestions, 
              {
                ...suggestion,
                timestamp: Date.now(),
                accepted: false,
                rejected: false,
                incorporated: false
              }
            ]
          };
        }
      }),
      
      acceptSuggestion: (suggestion) => set((state) => {
        const existingIndex = state.suggestions.findIndex(s => 
          s.original === suggestion.original && s.improved === suggestion.improved
        );
        
        let newSuggestions;
        
        if (existingIndex >= 0) {
          // Update existing suggestion
          newSuggestions = [...state.suggestions];
          newSuggestions[existingIndex] = {
            ...newSuggestions[existingIndex],
            ...suggestion,
            timestamp: Date.now(),
            accepted: true,
            rejected: false
          };
        } else {
          // Add new accepted suggestion
          newSuggestions = [
            ...state.suggestions, 
            {
              ...suggestion,
              timestamp: Date.now(),
              accepted: true,
              rejected: false,
              incorporated: false
            }
          ];
        }
        
        // Calculate new accepted count
        const acceptedCount = newSuggestions.filter(s => s.accepted && !s.incorporated).length;
        
        return { 
          suggestions: newSuggestions,
          acceptedCount
        };
      }),
      
      rejectSuggestion: (suggestion) => set((state) => {
        const existingIndex = state.suggestions.findIndex(s => 
          s.original === suggestion.original && s.improved === suggestion.improved
        );
        
        let newSuggestions;
        
        if (existingIndex >= 0) {
          // Update existing suggestion
          newSuggestions = [...state.suggestions];
          newSuggestions[existingIndex] = {
            ...newSuggestions[existingIndex],
            ...suggestion,
            timestamp: Date.now(),
            accepted: false,
            rejected: true
          };
        } else {
          // Add new rejected suggestion
          newSuggestions = [
            ...state.suggestions, 
            {
              ...suggestion,
              timestamp: Date.now(),
              accepted: false,
              rejected: true,
              incorporated: false
            }
          ];
        }
        
        // Calculate new accepted count
        const acceptedCount = newSuggestions.filter(s => s.accepted && !s.incorporated).length;
        
        return { 
          suggestions: newSuggestions,
          acceptedCount
        };
      }),
      
      markAsIncorporated: (original) => set((state) => {
        const newSuggestions = state.suggestions.map(s => {
          if (s.original === original) {
            return { ...s, incorporated: true };
          }
          return s;
        });
        
        // Calculate new accepted count
        const acceptedCount = newSuggestions.filter(s => s.accepted && !s.incorporated).length;
        
        return { 
          suggestions: newSuggestions,
          acceptedCount
        };
      }),
      
      markAllAsIncorporated: () => set((state) => {
        const newSuggestions = state.suggestions.map(s => ({ ...s, incorporated: true }));
        return { 
          suggestions: newSuggestions,
          acceptedCount: 0
        };
      }),
      
      getAcceptedSuggestions: () => {
        return get().suggestions.filter(s => s.accepted && !s.incorporated);
      },
      
      getRejectedSuggestions: () => {
        return get().suggestions.filter(s => s.rejected === true);
      },
      
      isSuggestionRejected: (suggestion) => {
        return get().suggestions.some(s => 
          s.original === suggestion.original && 
          s.improved === suggestion.improved && 
          s.rejected === true
        );
      },
      
      clearAllSuggestions: () => set({ suggestions: [], acceptedCount: 0 })
    }),
    {
      name: 'resume-suggestions-storage',
      partialize: (state) => ({ suggestions: state.suggestions })
    }
  )
);