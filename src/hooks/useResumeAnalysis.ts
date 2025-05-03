// src/hooks/useResumeAnalysis.ts

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ScoreBreakdownItem {
  score: number;
  comment: string;
  "What works": string[];
  "Improve": string[];
}

export interface ScoreBreakdown {
  quantified_impact: ScoreBreakdownItem;
  depth_of_ownership: ScoreBreakdownItem;
  growth_trajectory: ScoreBreakdownItem;
  structure_and_formatting: ScoreBreakdownItem;
  language_and_clarity: ScoreBreakdownItem;
  action_orientation: ScoreBreakdownItem;
  project_substance: ScoreBreakdownItem;
  keyword_optimization: ScoreBreakdownItem;
  brand_equity: ScoreBreakdownItem;
  academic_prestige: ScoreBreakdownItem;
  professionalism?: ScoreBreakdownItem;
}

export interface ResumeAnalysisResult {
  score: number;
  breakdown: ScoreBreakdown;
  summary: string;
  suggestions: string[];
  projectOneLiners?: string[];
  experienceLevel?: string;
  weights?: Record<string, number>;
}

// LocalStorage key
const SAVED_RESULTS_KEY = 'resumeAnalysisResults';

export function useResumeAnalysis(userId?: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResumeAnalysisResult | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [hasSavedResults, setHasSavedResults] = useState(false);

  const loadSavedResults = useCallback(() => {
    if (!userId) return false;

    const saved = localStorage.getItem(`${SAVED_RESULTS_KEY}_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setResults(parsed);
        setHasSavedResults(true);
        return true;
      } catch (err) {
        console.error('Error parsing saved results:', err);
        localStorage.removeItem(`${SAVED_RESULTS_KEY}_${userId}`);
      }
    }
    return false;
  }, [userId]);

  const saveResults = useCallback((resultsToSave: ResumeAnalysisResult) => {
    if (!userId) return;
    try {
      localStorage.setItem(`${SAVED_RESULTS_KEY}_${userId}`, JSON.stringify(resultsToSave));
      setHasSavedResults(true);
    } catch (err) {
      console.error('Error saving resume analysis results:', err);
    }
  }, [userId]);

  const analyzeResume = useCallback(async (
    resumeUrl: string,
    userId: string,
    projectIds: string[] = [],
    experienceYears?: number
  ) => {
    if (!resumeUrl || !userId) {
      setError('Missing resume URL or user ID.');
      return null;
    }

    setLoading(true);
    setError(null);

    console.log('Calling analyze-resume function with:', { resumeUrl, userId, projectIds, experienceYears });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeUrl, userId, projectIds, experienceYears },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error('Edge function returned error:', error);
        setError(error.message || 'Failed to analyze resume');
        setLoading(false);
        return null;
      }

      if (!data) {
        setError('No data returned from resume analysis');
        setLoading(false);
        return null;
      }

      console.log('Resume analysis successful:', data);

      setRawResponse(data);

      const formattedResult: ResumeAnalysisResult = {
        ...data,
      };

      setResults(formattedResult);
      saveResults(formattedResult);

      setLoading(false);
      return formattedResult;
    } catch (err) {
      console.error('Resume analysis error:', err);

      let errorMessage = 'Unknown error during analysis';
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Resume may be too large.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [saveResults]);

  const clearSavedResults = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(`${SAVED_RESULTS_KEY}_${userId}`);
    setHasSavedResults(false);
    setResults(null);
  }, [userId]);

  return {
    analyzeResume,
    loading,
    error,
    results,
    rawResponse,
    loadSavedResults,
    hasSavedResults,
    clearSavedResults,
  };
}