import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type InterviewType = 'technical' | 'behavioral' | 'system design' | 'cultural' | 'other';
type InterviewStatus = 'scheduled' | 'completed' | 'cancelled';

interface Interview {
  id: string;
  user_id: string;
  company: string;
  position: string;
  date: string;
  type: InterviewType;
  status: InterviewStatus;
  notes?: string;
  location?: string;
  interviewer?: string;
  recording_url?: string;
  transcript?: string;
  analysis_results?: any;
  analyzed_at?: string;
  created_at: string;
  updated_at: string;
}

export type InterviewInput = Omit<Interview, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const INTERVIEW_TYPES: InterviewType[] = ['technical', 'behavioral', 'system design', 'cultural', 'other'];
export const INTERVIEW_STATUSES: InterviewStatus[] = ['scheduled', 'completed', 'cancelled'];

export function useInterviews(userId: string | null) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviews = useCallback(async () => {
    if (!userId) {
      setInterviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      setInterviews(data || []);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError(err instanceof Error ? err.message : 'Error fetching interviews');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addInterview = async (interviewData: Partial<InterviewInput>): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      const { error } = await supabase
        .from('interviews')
        .insert([{ ...interviewData, user_id: userId }]);
      
      if (error) {
        throw error;
      }
      
      // Refresh the list
      fetchInterviews();
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error adding interview:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error adding interview' 
      };
    }
  };

  const updateInterview = async (id: string, updates: Partial<InterviewInput>): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      const { error } = await supabase
        .from('interviews')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setInterviews(prev => prev.map(i => 
        i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
      ));
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating interview:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error updating interview' 
      };
    }
  };

  const deleteInterview = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    try {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setInterviews(prev => prev.filter(i => i.id !== id));
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting interview:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error deleting interview' 
      };
    }
  };

  const getUpcomingInterviews = () => {
    const now = new Date();
    return interviews
      .filter(i => i.status === 'scheduled' && new Date(i.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getPastInterviews = () => {
    const now = new Date();
    return interviews
      .filter(i => i.status === 'completed' || new Date(i.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  return {
    interviews,
    loading,
    error,
    addInterview,
    updateInterview,
    deleteInterview,
    getUpcomingInterviews,
    getPastInterviews,
    refresh: fetchInterviews
  };
}