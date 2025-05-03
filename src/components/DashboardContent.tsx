import React, { memo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ContentLoading } from './LoadingState';
import { supabase } from '../lib/supabase';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { Alert } from './Alert';
import { WelcomeMessage } from './dashboard/WelcomeMessage';
import { UserDashboardCards } from './dashboard/UserDashboardCards';
import { AdminDashboardSection } from './dashboard/AdminDashboardSection';

interface DashboardContentProps {
  email: string;
}

// Use React.memo to prevent unnecessary re-renders
export const DashboardContent = memo(function DashboardContent({ email }: DashboardContentProps) {
  const navigate = useNavigate();
  const { user, initialized, profile } = useAuth();
  const { isAdmin, loading: adminLoading, error: adminError } = useAdminStatus();
  const [interviewCount, setInterviewCount] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedDataRef = useRef(false);

  console.log('🖥️ DashboardContent rendering with user:', user?.id, 'initialized:', initialized);

  // Fetch interview data once when component mounts
  useEffect(() => {
    const fetchInterviewData = async () => {
      if (!user?.id || hasLoadedDataRef.current) return;

      setDataLoading(true);
      setError(null);

      try {
        const { count: interviewCount, error: countError } = await supabase
          .from('mock_interviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (countError) throw countError;

        const { data: scoreData, error: scoreError } = await supabase
          .from('mock_interviews')
          .select('overall_score')
          .eq('user_id', user.id)
          .not('overall_score', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (scoreError) throw scoreError;

        setInterviewCount(interviewCount || 0);
        setLastScore(scoreData?.[0]?.overall_score || null);
        hasLoadedDataRef.current = true;
      } catch (err) {
        console.error('Error fetching interview data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load interview data');
      } finally {
        setDataLoading(false);
      }
    };

    if (user?.id) {
      fetchInterviewData();
    }
  }, [user?.id]);

  const displayName = profile?.firstName || (email ? email.split('@')[0] : 'User');

  if (!initialized || dataLoading || adminLoading) {
    console.log('⏳ Dashboard is loading...', { initialized, dataLoading, adminLoading });
    return (
      <ContentLoading 
        message="Loading your dashboard..." 
        icon={<div className="h-12 w-12 relative">
          <div className="absolute h-full w-full border-4 border-gray-600 rounded-full"></div>
          <div className="absolute h-full w-full border-4 border-[#FF8A00] rounded-full animate-spin border-t-transparent"></div>
        </div>}
        className="h-[40vh]"
      />
    );
  }

  console.log('✅ Dashboard loaded with data:', { firstName: profile?.firstName, interviewCount, lastScore, isAdmin });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <WelcomeMessage displayName={displayName} />
      </div>

      {(error || adminError) && (
        <Alert 
          variant="error" 
          message={error || adminError || 'An error occurred loading dashboard data'} 
          className="mb-6" 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <UserDashboardCards 
          interviewCount={interviewCount} 
          lastScore={lastScore} 
        />
      </div>

      {isAdmin && (
        <AdminDashboardSection />
      )}
    </div>
  );
});
