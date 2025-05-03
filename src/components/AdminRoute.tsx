import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { LoadingState } from '../components/LoadingState';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
  fallback?: string; // Where to redirect non-admins
}

export const AdminRoute = React.memo(function AdminRoute({ children, fallback = '/dashboard' }: AdminRouteProps) {
  const { isAdmin, loading, error } = useAdminStatus();

  // Only log in development
  if (import.meta.env.DEV) {
    console.log('AdminRoute - isAdmin:', isAdmin, 'loading:', loading, 'error:', error);
  }

  // Show loading state if admin status is still loading
  if (loading) {
    return <LoadingState text="Verifying admin access..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F121A] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-red-500/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">{error}</p>
            <p className="text-gray-400 text-sm">
              There was a problem verifying your admin permissions. Please try refreshing the page or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('User is not an admin, redirecting to:', fallback);
    }
    // Redirect non-admin users to fallback route (dashboard by default)
    return <Navigate to={fallback} replace />;
  }

  // Only log in development
  if (import.meta.env.DEV) {
    console.log('User is an admin, rendering protected content');
  }
  // If user is an admin, render the protected content
  return <>{children}</>;
});