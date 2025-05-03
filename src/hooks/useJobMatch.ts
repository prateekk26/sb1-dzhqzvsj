import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Enable debug logging
const DEBUG = true;

// Define the job match result interface
export interface JobMatchResult {
  matchScore: number;
  matchScoreRationale?: string;
  keywordMatches: {
    matched: string[];
    missing: string[];
  };
  skills: {
    matched: string[];
    missing: string[];
  };
  analysis: string;
  strengthsAnalysis?: string;
  gapsAnalysis?: string;
  recommendations: string[];
  emailOutreach: string;
  linkedinOutreach: string;
  coverLetter: string;
  companyInfo?: string;
  companyRating?: number;
  salaryRange?: string;
}

export function useJobMatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<JobMatchResult | null>(null);
  const [networkStatus, setNetworkStatus] = useState<{ status: number; ok: boolean } | null>(null);

  const analyzeJobMatch = useCallback(async (
    resumeUrl: string, 
    jobDescriptionText: string, 
    userId: string,
    companyName?: string,
    positionName?: string
  ) => {
    if (!resumeUrl || !jobDescriptionText) {
      setError('Both resume and job description are required');
      return null;
    }

    setLoading(true);
    setError(null);
    setNetworkStatus(null);
    setResults(null);

    if (DEBUG) console.log('🔍 Starting job match analysis...');
    
    try {
      console.log('📤 Calling analyze-job-match Edge Function with:', { 
        resumeUrl: resumeUrl.substring(0, 50) + '...',
        jobDescriptionLength: jobDescriptionText.length,
        companyName,
        positionName
      });
      
      // Set a timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout for complex analysis
      
      try {
        const { data, error } = await supabase.functions.invoke('analyze-job-match', {
          body: { 
            resumeUrl, 
            jobDescriptionText,
            userId,
            companyName: companyName || 'the company',
            positionName: positionName || 'the position'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Store network status information
        setNetworkStatus({ 
          status: error ? 500 : 200, 
          ok: !error 
        });

        if (error) {
          console.error('❌ Edge Function returned error:', error);
          throw new Error(error.message || 'Error analyzing job match');
        } 

        if (!data) {
          console.warn('⚠️ No data returned from Edge Function');
          throw new Error('No data returned from analysis');
        }

        console.log('Job match analysis results:', data);

        // Validate the response has the required fields
        if (!data.matchScore || !data.analysis || !data.emailOutreach || !data.linkedinOutreach || !data.coverLetter) {
          console.error('❌ Invalid response format from Edge Function');
          throw new Error('The analysis service returned an incomplete response. Please try again.');
        }

        
        // Save the results for later retrieval
        if (userId) {
          try {
            localStorage.setItem(`job_match_results_${userId}`, JSON.stringify(data));
          } catch (e) {
            console.error('Error saving job match results to localStorage:', e);
          }
        }

        setResults(data);
        setLoading(false);
        return data;
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError.name === 'AbortError') {
          throw new Error('Request timeout: The analysis took too long to complete. Please try again later.');
        }
        throw abortError;
      }
    } catch (err) {
      console.error('❌ Job match analysis failed:', err);
      
      // Check if this is a timeout or connection error
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('aborted')) {
          console.warn('⏱️ Request timeout: The Edge Function took too long to respond');
          setError('The analysis took too long to complete. This could be due to the complexity of the job description or resume. Please try again with a simpler job description.');
          setNetworkStatus({ status: 504, ok: false });
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          console.warn('🌐 Network error: Unable to connect to the Edge Function');
          setError('Network error: Unable to connect to the analysis service. Please check your internet connection and try again.');
          setNetworkStatus({ status: 503, ok: false });
        }
      }
      
      console.error('Job match analysis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setLoading(false);
      return null;
    }
  }, []);

  // Load saved results from localStorage
  const loadSavedResults = useCallback((userId: string) => {
    try {
      if (DEBUG) console.log('🔄 Attempting to load saved job match results for user:', userId);
      const savedResults = localStorage.getItem(`job_match_results_${userId}`);
      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        setResults(parsed);
        console.log('✅ Successfully loaded saved job match results');
        return true;
      }
      console.log('ℹ️ No saved job match results found');
    } catch (e) {
      console.error('Error loading saved job match results:', e);
    }
    return false;
  }, []);

  // Clear saved results
  const clearSavedResults = useCallback((userId: string) => {
    try {
      if (DEBUG) console.log('🗑️ Clearing saved job match results for user:', userId);
      localStorage.removeItem(`job_match_results_${userId}`);
      setResults(null);
    } catch (e) {
      console.error('Error clearing saved job match results:', e);
    }
  }, []);

  return {
    analyzeJobMatch,
    loading,
    error,
    results,
    networkStatus,
    loadSavedResults,
    clearSavedResults
  };
}