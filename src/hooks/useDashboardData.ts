import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardData {
  firstName: string;
  interviewCount: number;
  lastScore: number | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(userId: string | undefined): DashboardData {
  const [firstName, setFirstName] = useState<string>('');
  const [interviewCount, setInterviewCount] = useState<number>(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the loadDashboardData function with proper dependencies
  const loadDashboardData = useCallback(async () => {
    if (!userId) {
      console.log('No userId provided to useDashboardData, skipping data load');
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log(`📊 Starting dashboard data load for user: ${userId}`);
    setError(null);

    try {
      // Use Promise.all to fetch all data in parallel
      const [profileResponse, interviewCountResponse, recentScoreResponse] = await Promise.all([
        // Fetch user profile
        supabase
          .from('users_profile')
          .select('first_name, id') // Include id for debugging
          .eq('user_id', userId)
          .single(),
          
        // Fetch interview count
        supabase
          .from('mock_interviews')
          .select('id', { count: 'exact', head: true }) // Use head: true for count-only query
          .eq('user_id', userId)
          .eq('status', 'completed'),
          
        // Fetch most recent interview score
        supabase
          .from('mock_interviews')
          .select('overall_score') // Only select the field we need
          .eq('user_id', userId)
          .not('overall_score', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
      ]);

      console.log('📊 Profile response:', JSON.stringify(profileResponse));
      console.log('📊 Interview count response:', JSON.stringify(interviewCountResponse));
      console.log('📊 Recent score response:', JSON.stringify(recentScoreResponse));

      // Process profile data
      if (profileResponse.error) {
        console.error('❌ Error fetching user profile:', profileResponse.error);
        setError(prev => prev || 'Failed to load profile data');
      } else if (profileResponse.data) {
        console.log('✅ Profile fetched:', profileResponse.data);
        setFirstName(profileResponse.data.first_name || '');
      }

      // Process interview count
      if (interviewCountResponse.error) {
        console.error('❌ Error fetching interview count:', interviewCountResponse.error);
        setError(prev => prev || 'Failed to load interview data');
      } else {
        console.log('✅ Completed interviews count:', interviewCountResponse.count);
        setInterviewCount(interviewCountResponse.count || 0);
      }

      // Process recent score
      if (recentScoreResponse.error) {
        console.error('❌ Error fetching recent interview score:', recentScoreResponse.error);
        setError(prev => prev || 'Failed to load score data');
      } else {
        console.log('✅ Last interview score:', recentScoreResponse.data?.[0]?.overall_score);
        setLastScore(recentScoreResponse.data?.[0]?.overall_score ?? null);
      }
    } catch (err) {
      console.error('❌ Unexpected error loading dashboard data:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      console.log('🏁 Finished dashboard data load');
    }
  }, [userId]); // userId is the only dependency needed

  useEffect(() => {
    // Only load data if we have a userId
    if (userId) {
      console.log(`📊 useEffect triggered for userId: ${userId}`);
      loadDashboardData();
    } else {
      console.log('📊 No userId in useEffect, skipping data load');
      setLoading(false);
    }
  }, [userId, loadDashboardData]); // Include both userId and loadDashboardData as dependencies

  console.log(`📊 useDashboardData returning:`, { 
    firstName, 
    interviewCount, 
    lastScore, 
    loading, 
    error 
  });
  
  return {
    firstName,
    interviewCount,
    lastScore,
    loading,
    error
  };
}