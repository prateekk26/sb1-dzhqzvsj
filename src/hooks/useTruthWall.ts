import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Types for interview review
export interface InterviewReview {
  id: string;
  user_id: string | null;
  session_id: string | null;
  company_name: string;
  role_title: string | null;
  stage: string;
  date_range: string | null;
  was_ghosted: boolean | null;
  interviewer_attitude: string | null;
  gave_feedback: boolean | null;
  had_assignment: boolean | null;
  assignment_duration: string | null;
  previous_salary: string | null;
  expected_salary: string | null;
  offered_salary: string | null;
  comments: string | null;
  moderation_status: string;
  created_at: string;
}

// Types for top companies
export interface TopGhostingCompany {
  company_name: string;
  ghost_count: number;
  trend?: 'up' | 'down' | 'same';
}

export interface RespectfulCompany {
  company_name: string;
  respect_score: number;
  tags?: string[];
}

export interface PopularTag {
  tag: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// Input type for creating a review
export interface InterviewReviewInput {
  company_name: string;
  company_linkedin_url?: string;
  role_title?: string;
  stage: string;
  date_range?: string;
  was_ghosted?: boolean;
  interviewer_attitude?: string;
  gave_feedback?: boolean;
  had_assignment?: boolean;
  assignment_duration?: string;
  previous_salary?: string;
  expected_salary?: string;
  offered_salary?: string;
  comments?: string;
  location?: string;
}

export function useTruthWall(userId?: string) {
  const [reviews, setReviews] = useState<InterviewReview[]>([]);
  const [topGhosters, setTopGhosters] = useState<TopGhostingCompany[]>([]);
  const [respectfulCompanies, setRespectfulCompanies] = useState<RespectfulCompany[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize session ID if not already set
  useEffect(() => {
    // Check if we have a session ID in localStorage
    const storedSessionId = localStorage.getItem('truth_wall_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      // Generate a new session ID
      const newSessionId = uuidv4();
      localStorage.setItem('truth_wall_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Fetch approved reviews
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('interview_reviews')
        .select('*')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch top ghosting companies
  const fetchTopGhosters = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_top_ghosting_companies');
      
      if (error) throw error;
      
      // Add trend data (this would normally come from the database)
      const enhancedData = (data || []).map((company: any) => ({
        company_name: company.company_name,
        ghost_count: company.ghost_count,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'same'
      }));
      
      setTopGhosters(enhancedData);
    } catch (err) {
      console.error('Error fetching top ghosters:', err);
      // Don't set error state here to avoid blocking the UI
      // Just use mock data as fallback
      setTopGhosters([
        { company_name: 'Acme Corp', ghost_count: 87, trend: 'up' },
        { company_name: 'Globex Inc', ghost_count: 64, trend: 'down' },
        { company_name: 'Initech', ghost_count: 52, trend: 'up' },
        { company_name: 'Massive Dynamic', ghost_count: 43, trend: 'same' },
        { company_name: 'Umbrella Corp', ghost_count: 38, trend: 'up' }
      ]);
    }
  }, []);

  // Fetch most respectful companies
  const fetchRespectfulCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_most_respectful_companies');
      
      if (error) throw error;
      
      // Add tags data (this would normally come from the database)
      const enhancedData = (data || []).map((company: any) => ({
        company_name: company.company_name,
        respect_score: company.respect_score,
        tags: ['Gave Feedback', 'Fair Salary', 'Transparent', 'Quick Process'].sort(() => 0.5 - Math.random()).slice(0, 2)
      }));
      
      setRespectfulCompanies(enhancedData);
    } catch (err) {
      console.error('Error fetching respectful companies:', err);
      // Use mock data as fallback
      setRespectfulCompanies([
        { company_name: 'Pied Piper', respect_score: 92, tags: ['Gave Feedback', 'Fair Salary'] },
        { company_name: 'Stark Industries', respect_score: 88, tags: ['Transparent', 'Quick Process'] },
        { company_name: 'Wayne Enterprises', respect_score: 85, tags: ['Fair Salary', 'Respectful'] },
        { company_name: 'Hooli', respect_score: 82, tags: ['Transparent'] }
      ]);
    }
  }, []);

  // Fetch popular tags
  const fetchPopularTags = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_popular_tags');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPopularTags(data);
      } else {
        // Use mock data if no real data
        setPopularTags([
          { tag: 'Ghosted', count: 342, sentiment: 'negative' },
          { tag: 'Lowball', count: 287, sentiment: 'negative' },
          { tag: 'Transparent', count: 245, sentiment: 'positive' },
          { tag: 'Respectful', count: 213, sentiment: 'positive' },
          { tag: 'Dragged', count: 189, sentiment: 'negative' },
          { tag: 'Wasted Time', count: 176, sentiment: 'negative' },
          { tag: 'Fair Offer', count: 154, sentiment: 'positive' },
          { tag: 'Quick Process', count: 132, sentiment: 'positive' },
          { tag: 'Rude', count: 118, sentiment: 'negative' },
          { tag: 'Helpful', count: 97, sentiment: 'positive' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching popular tags:', err);
      // Use mock data as fallback
      setPopularTags([
        { tag: 'Ghosted', count: 342, sentiment: 'negative' },
        { tag: 'Lowball', count: 287, sentiment: 'negative' },
        { tag: 'Transparent', count: 245, sentiment: 'positive' },
        { tag: 'Respectful', count: 213, sentiment: 'positive' },
        { tag: 'Dragged', count: 189, sentiment: 'negative' },
        { tag: 'Wasted Time', count: 176, sentiment: 'negative' },
        { tag: 'Fair Offer', count: 154, sentiment: 'positive' },
        { tag: 'Quick Process', count: 132, sentiment: 'positive' },
        { tag: 'Rude', count: 118, sentiment: 'negative' },
        { tag: 'Helpful', count: 97, sentiment: 'positive' }
      ]);
    }
  }, []);

  // Submit a new review
  const submitReview = useCallback(async (reviewData: InterviewReviewInput) => {
    try {
      setError(null);
      
      // Prepare the data
      const data = {
        ...reviewData,
        user_id: userId || null,
        session_id: !userId ? sessionId : null,
        moderation_status: 'approved'
      };
      
      const { error } = await supabase
        .from('interview_reviews')
        .insert([data]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
      return { success: false, error: err instanceof Error ? err.message : 'Failed to submit review' };
    }
  }, [userId, sessionId]);

  // Fetch all data on mount
  useEffect(() => {
    fetchReviews();
    fetchTopGhosters();
    fetchRespectfulCompanies();
    fetchPopularTags();
  }, [fetchReviews, fetchTopGhosters, fetchRespectfulCompanies, fetchPopularTags]);

  return {
    reviews,
    topGhosters,
    respectfulCompanies,
    popularTags,
    loading,
    error,
    submitReview,
    sessionId,
    refresh: fetchReviews
  };
}