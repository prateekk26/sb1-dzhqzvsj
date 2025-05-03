import { supabase } from '../lib/supabase';

/**
 * Get the current auth token from Supabase
 * @returns Promise<string> The auth token
 */
export async function getAuthToken(): Promise<string> {
  try {
    console.log('Getting auth token...');
    const { data } = await supabase.auth.getSession();
    console.log('Session available:', !!data.session);
    return data.session?.access_token || '';
  } catch (error) {
    console.error('Error getting auth token:', error);
    return '';
  }
}

/**
 * Check if the current user is an admin
 * @returns Promise<boolean> True if the user is an admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    console.log('Checking if user is admin...');
    const { data, error } = await supabase.rpc('is_admin_user');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    console.log('Admin check result:', data);
    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}