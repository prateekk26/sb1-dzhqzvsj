import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';

// Cache admin status to avoid redundant checks
const adminStatusCache = new Map<string, boolean>();

export const useAdminStatus = () => {
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkInProgressRef = useRef(false);
  const checkAttemptedRef = useRef(false);
  const lastCheckedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    console.log('🛡️ useAdminStatus effect running for user:', user?.id);

    const checkAdminStatus = async () => {
      // Skip if we've already checked for this user ID
      if (user?.id === lastCheckedUserIdRef.current && !loading) {
        console.log('🛡️ Admin status already checked for this user, skipping');
        // Use cached result if available
        if (adminStatusCache.has(user.id)) {
          if (!isCancelled) {
            setIsAdmin(adminStatusCache.get(user.id) || false);
            setLoading(false);
          }
        }
        return;
      }
      
      if (!user?.id) {
        if (!isCancelled) {
          setIsAdmin(false);
          setLoading(false);
          checkAttemptedRef.current = true;
        }
        return;
      }
      
      // Prevent concurrent checks
      if (checkInProgressRef.current) {
        console.log('🛡️ Admin check already in progress, skipping');
        return;
      }
      
      console.log('🛡️ Checking admin status for user:', user.id);

      // Skip if we've already attempted a check and are waiting for user data
      if (checkAttemptedRef.current && !user?.id) return;

      try {
        checkInProgressRef.current = true;
        if (!isCancelled) {
          setLoading(true);
          setError(null);
        }

        // Check if we have a cached result
        if (adminStatusCache.has(user.id)) {
          console.log('🛡️ Using cached admin status for user:', user.id);
          if (!isCancelled) {
            setIsAdmin(adminStatusCache.get(user.id) || false);
            setLoading(false);
            checkAttemptedRef.current = true;
            lastCheckedUserIdRef.current = user.id;
          }
          checkInProgressRef.current = false;
          return;
        }

        console.log('🛂 Calling is_admin_user RPC...');
        
        // Add a timeout to prevent multiple rapid calls
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data, error } = await supabase.rpc('is_admin_user');

        if (error) {
          console.error('❌ Admin check RPC error:', error);
          throw new Error(error.message);
        }

        if (!isCancelled) {
          console.log('✅ Admin check result:', data);
          setIsAdmin(!!data);
          checkAttemptedRef.current = true;
          lastCheckedUserIdRef.current = user.id;
          // Cache the result
          adminStatusCache.set(user.id, !!data);
        }
      } catch (err) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          console.error('❌ Admin check failed:', msg);
          setError(msg);
          setIsAdmin(false);
          checkAttemptedRef.current = true;
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          checkInProgressRef.current = false;
        }
      }
    };

    // Only check admin status if we have a user ID
    if (user?.id) {
      console.log('🛡️ Triggering admin status check for user:', user.id);
      checkAdminStatus();
    } else {
      console.log('🛡️ No user ID, setting isAdmin to false');
      setIsAdmin(false);
      setLoading(false);
      checkAttemptedRef.current = true;
    }

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  console.log('🛡️ useAdminStatus returning:', { isAdmin, loading, error });
  return { isAdmin, loading, error };
};