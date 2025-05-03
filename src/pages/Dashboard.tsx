import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardContent } from '../components/DashboardContent';
import { LoadingSpinner } from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, initialized, isProfileComplete } = useAuth();

  useEffect(() => {
    if (!loading && initialized) {
      if (!user) {
        console.log('No authenticated user, redirecting to landing page');
        navigate('/', { replace: true });
      } else if (!isProfileComplete()) {
        console.log('User profile incomplete, redirecting to complete profile page');
        navigate('/complete-profile', { replace: true });
      }
    }
  }, [loading, initialized, user, navigate, isProfileComplete]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-[#0F121A] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <DashboardContent email={user.email || ''} />
    </div>
  );
}
