import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { InterviewGrade } from '../utils/types';

interface MockInterviewResult {
  id: string;
  user_id: string;
  created_at: string;
  started_at: string;
  ended_at: string | null;
  competency_scores: InterviewGrade | null;
  overall_score: number | null;
  feedback: string | null;
  transcript: string | null;
  status: string;
  audio_url: string | null;
  grading_status: string | null;
  grading_completed_at: string | null;
  competencies_assessed: string[] | null;
}

export function useInterviewResults(userId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MockInterviewResult[]>([]);

  const fetchInterviewResults = useCallback(async () => {
    if (!userId) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check network connectivity first
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      console.log('Fetching interview results for user:', userId);
      
      const { data, error: fetchError } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to recent 20 results

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw new Error(`Database error: ${fetchError.message}`);
      }

      console.log(`Successfully fetched ${data?.length || 0} interview results`);
      setResults(data || []);
    } catch (err) {
      console.error('Error fetching interview results:', err);
      setError(err instanceof Error ? `Error fetching interview results: ${err.message}` : 'Failed to fetch interview results');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getInterviewResultById = useCallback(async (id: string): Promise<MockInterviewResult | null> => {
    if (!userId) return null;

    try {
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }
      
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error fetching interview result:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch interview result');
      return null;
    }
  }, [userId]);

  useEffect(() => {
    fetchInterviewResults();
  }, [fetchInterviewResults]);

  const getCompetencyAverageScore = useCallback((competencyCode: string): number | null => {
    if (!results || results.length === 0) return null;
    
    const scoresForCompetency = results
      .filter(r => 
        r.competency_scores && 
        r.competency_scores.competencyScores && 
        r.competency_scores.competencyScores.some((cs: any) => cs.code === competencyCode)
      )
      .map(r => {
        const competencyScore = r.competency_scores.competencyScores.find(
          (cs: any) => cs.code === competencyCode
        );
        return competencyScore ? competencyScore.score : null;
      })
      .filter(score => score !== null) as number[];
    
    if (scoresForCompetency.length === 0) return null;
    
    const average = scoresForCompetency.reduce((sum, score) => sum + score, 0) / scoresForCompetency.length;
    return parseFloat(average.toFixed(1));
  }, [results]);

  const getOverallAverageScore = useCallback((): number | null => {
    if (!results || results.length === 0) return null;
    
    const overallScores = results
      .filter(r => r.overall_score !== null)
      .map(r => r.overall_score) as number[];
    
    if (overallScores.length === 0) return null;
    
    const average = overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length;
    return parseFloat(average.toFixed(1));
  }, [results]);

  return {
    results,
    loading,
    error,
    fetchInterviewResults,
    getInterviewResultById,
    getCompetencyAverageScore,
    getOverallAverageScore
  };
}