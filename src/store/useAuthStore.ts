import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Define the user profile type
interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  email: string | null;
  role?: 'user' | 'recruiter' | 'admin';
  suspended?: boolean;
  profileCompleted?: boolean;
}

// Define the auth store state
interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  bypassProfile: boolean;
}

// Define the auth store actions
interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any | null; user: User | null }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isProfileComplete: () => boolean;
  bypassProfileCompletion: (bypass: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the auth store
export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,
  error: null,
  bypassProfile: localStorage.getItem('bypass_profile_completion') === 'true',

  // Actions
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };

      set({ user: data.user, session: data.session });
      
      // Fetch user profile
      if (data.user) {
        const { data: profileData } = await supabase
          .from('users_profile')
          .select('first_name, last_name, linkedin_url, resume_url, email, role, suspended, profile_completed')
          .eq('user_id', data.user.id)
          .single();
          
        if (profileData) {
          set({
            profile: {
              firstName: profileData.first_name,
              lastName: profileData.last_name,
              linkedinUrl: profileData.linkedin_url,
              resumeUrl: profileData.resume_url,
              email: profileData.email,
              role: profileData.role,
              suspended: profileData.suspended,
              profileCompleted: profileData.profile_completed
            }
          });
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      
      if (error) return { error, user: null };
      
      set({ user: data.user });
      return { error: null, user: data.user };
    } catch (error) {
      return { error, user: null };
    } finally {
      set({ loading: false });
    }
  },
  
  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) return { error };
      
      // Note: We don't set user/session here because the redirect will happen
      // and the auth state will be updated on return via refreshSession
      
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        session: null, 
        profile: null, 
        error: null 
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        set({ 
          user: null, 
          session: null, 
          profile: null, 
          loading: false, 
          initialized: true, 
          error: null 
        });
        return;
      }
      
      set({ user: data.session.user, session: data.session });
      
      // Fetch user profile
      if (data.session.user) {
        const { data: profileData } = await supabase
          .from('users_profile')
          .select('first_name, last_name, linkedin_url, resume_url, email, role, suspended, profile_completed')
          .eq('user_id', data.session.user.id)
          .single();
          
        if (profileData) {
          set({
            profile: {
              firstName: profileData.first_name,
              lastName: profileData.last_name,
              linkedinUrl: profileData.linkedin_url,
              resumeUrl: profileData.resume_url,
              email: profileData.email,
              role: profileData.role,
              suspended: profileData.suspended,
              profileCompleted: profileData.profile_completed
            }
          });
        }
      }
      
      set({ loading: false, initialized: true });
    } catch (error) {
      console.error('Error refreshing session:', error);
      set({ 
        loading: false, 
        initialized: true, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  isProfileComplete: () => {
    const { bypassProfile, profile } = get();
    
    if (bypassProfile) return true;
    if (!profile) return false;
    
    // If profile_completed flag is explicitly set, use that
    if (profile.profileCompleted !== undefined) {
      return profile.profileCompleted;
    }
    
    // Otherwise, check if all required fields are filled
    return !!(
      profile.firstName?.trim() &&
      profile.lastName?.trim() &&
      profile.linkedinUrl?.trim() &&
      profile.resumeUrl?.trim()
    );
  },

  bypassProfileCompletion: (bypass) => {
    set({ bypassProfile: bypass });
    localStorage.setItem('bypass_profile_completion', bypass.toString());
  },

  // Setter methods for state updates
  setProfile: (profile) => set({ profile }),
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setError: (error) => set({ error })
}));