import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { LoadingState } from '../components/LoadingState';
import { isProfileComplete as checkIsProfileComplete } from '../utils/isProfileComplete';

// Import types from the store
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  email: string | null;
  role?: 'user' | 'recruiter' | 'admin';
  suspended?: boolean;
  profileCompleted?: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create the context with the same interface as the store
const AuthContext = createContext<ReturnType<typeof useAuthStore> | undefined>(undefined);

// ===== Auth Provider =====
export function AuthProvider({ children }: AuthProviderProps) {
  // Use the auth store
  const auth = useAuthStore();
  const navigate = useNavigate();
  
  // Set up session refresh interval
  useEffect(() => {
    auth.refreshSession();
    const intervalId = setInterval(auth.refreshSession, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Redirect to landing page on sign out
  const originalSignOut = auth.signOut;
  const wrappedSignOut = useCallback(async () => {
    await originalSignOut();
    navigate('/', { replace: true });
  }, [originalSignOut, navigate]);

  // Add isProfileComplete function that uses the utility function
  const isProfileComplete = useCallback(() => {
    return checkIsProfileComplete(auth.profile);
  }, [auth.profile]);

  // Create a wrapped version of auth with the navigation-aware signOut
  const wrappedAuth = {
    ...auth,
    signOut: wrappedSignOut,
    isProfileComplete
  };

  if (auth.loading) {
    return <LoadingState />;
  }

  return (
    <AuthContext.Provider value={wrappedAuth}>
      {children}
    </AuthContext.Provider>
  );
}

// ===== Hook =====
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}