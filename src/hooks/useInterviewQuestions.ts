import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface InterviewQuestion {
  id: string;
  question: string;
  primary_competency_code: string | null;
  secondary_competency_code: string | null;
  difficulty: string | null;
  created_at: string;
  updated_at: string;
  question_id: string | null;
  type: string | null;
}

export type QuestionInput = Omit<InterviewQuestion, 'id' | 'created_at' | 'updated_at'>;

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard'];
export const QUESTION_TYPES: string[] = ['situational', 'behavioral', 'technical', 'case study', 'other'];

export function useInterviewQuestions() {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  const checkAdminStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin_user');
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (err) {
      console.error('Admin check error:', err);
      setIsAdmin(false);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection.');
      }

      console.log('Fetching interview questions from Supabase...');
      
      // Enhanced error handling for the Supabase call
      try {
        const response = await supabase
          .from('interview_questions')
          .select('*')
          .order('updated_at', { ascending: false });
        
        // Log the full response for debugging
        console.log('Questions response:', response);
          
        if (response.error) {
          console.error('Supabase error details:', {
            code: response.error.code,
            message: response.error.message,
            hint: response.error.hint,
            details: response.error.details
          });
          throw response.error;
        }
  
        setQuestions(response.data || []);
        console.log(`Successfully fetched ${response.data?.length || 0} questions`);
      } catch (supabaseError) {
        // Handle specific Supabase errors
        console.error('Supabase fetch error:', supabaseError);
        
        // Provide more specific error messages based on error
        if (supabaseError instanceof Error) {
          if (supabaseError.message.includes('Failed to fetch')) {
            throw new Error('Network error connecting to database. Please check your connection.');
          } else if (supabaseError.message.includes('JWT')) {
            throw new Error('Authentication error. Please try logging out and back in.');
          }
        }
        
        throw supabaseError;
      }
    } catch (err) {
      console.error('Error fetching interview questions:', err);
      setError(err instanceof Error 
        ? `Error fetching interview questions: ${err.message}` 
        : 'Error fetching interview questions');
    } finally {
      setLoading(false);
    }
  }, []);

  const addQuestion = async (questionData: QuestionInput): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Insert question without user_id
      const { error } = await supabase
        .from('interview_questions')
        .insert([questionData]);
      
      if (error) {
        throw error;
      }
      
      // Refresh the list
      fetchQuestions();
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error adding interview question:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error adding interview question' 
      };
    }
  };

  const updateQuestion = async (id: string, updates: Partial<QuestionInput>): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('interview_questions')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setQuestions(prev => prev.map(q => 
        q.id === id ? { ...q, ...updates, updated_at: new Date().toISOString() } : q
      ));
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating interview question:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error updating interview question' 
      };
    }
  };

  const deleteQuestion = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('interview_questions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setQuestions(prev => prev.filter(q => q.id !== id));
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting interview question:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error deleting interview question' 
      };
    }
  };

  const getQuestionsByCompetency = (competencyCode: string | null): InterviewQuestion[] => {
    if (!competencyCode) return questions;
    return questions.filter(q => 
      q.primary_competency_code === competencyCode || 
      q.secondary_competency_code === competencyCode
    );
  };

  const getQuestionsByDifficulty = (difficulty: string | null): InterviewQuestion[] => {
    if (!difficulty) return questions;
    return questions.filter(q => q.difficulty === difficulty);
  };

  const getQuestionsByType = (type: string | null): InterviewQuestion[] => {
    if (!type) return questions;
    return questions.filter(q => q.type?.toLowerCase() === type.toLowerCase());
  };

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        await fetchQuestions();
        await checkAdminStatus();
      } catch (err) {
        console.error('Failed to load interview questions during initialization:', err);
      }
    };
    
    loadQuestions();
  }, [fetchQuestions, checkAdminStatus]);

  return {
    questions,
    loading,
    error,
    isAdmin,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsByCompetency,
    getQuestionsByDifficulty,
    getQuestionsByType,
    refresh: fetchQuestions
  };
}