/*
  # Create admin user management functions
  
  1. New Functions
    - `get_all_users_with_profiles` - Returns all users with their profile data
    - `admin_delete_user_cascade` - Deletes a user and all associated data
    
  2. Security
    - Functions are SECURITY DEFINER to run with elevated privileges
    - Admin check is performed to ensure only admins can use these functions
    - Search path is explicitly set to prevent search path injection
*/

-- Create function to get all users with their profiles
CREATE OR REPLACE FUNCTION public.get_all_users_with_profiles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  app_metadata JSONB,
  user_metadata JSONB,
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  profile_email TEXT,
  profile_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only administrators can access user data';
  END IF;
  
  -- Return users with their profile data
  RETURN QUERY 
  SELECT 
    u.id AS user_id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.raw_app_meta_data AS app_metadata,
    u.raw_user_meta_data AS user_metadata,
    p.id AS profile_id,
    p.first_name,
    p.last_name,
    p.linkedin_url,
    p.resume_url,
    p.email AS profile_email,
    p.created_at AS profile_created_at
  FROM auth.users u
  LEFT JOIN public.users_profile p ON u.id = p.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Create function to delete a user and all associated data
CREATE OR REPLACE FUNCTION public.admin_delete_user_cascade(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;
  
  -- Get the current user's ID
  SELECT auth.uid() INTO current_user_id;
  
  -- Prevent admins from deleting themselves
  IF user_id = current_user_id THEN
    RAISE EXCEPTION 'Administrators cannot delete their own accounts';
  END IF;
  
  -- Delete user data from various tables
  -- The order matters due to foreign key constraints
  
  -- Delete projects
  DELETE FROM public.projects WHERE user_id = admin_delete_user_cascade.user_id;
  
  -- Delete experiences
  DELETE FROM public.experiences WHERE user_id = admin_delete_user_cascade.user_id;
  
  -- Delete mock interviews
  DELETE FROM public.mock_interviews WHERE user_id = admin_delete_user_cascade.user_id;
  
  -- Delete interviews
  DELETE FROM public.interviews WHERE user_id = admin_delete_user_cascade.user_id;
  
  -- Delete references
  DELETE FROM public.references WHERE user_id = admin_delete_user_cascade.user_id;
  
  -- Delete user profile
  DELETE FROM public.users_profile WHERE user_id = admin_delete_user_cascade.user_id;
  
  -- Delete the auth user
  -- Note: In Supabase, this requires admin API access and cannot be done directly in SQL
  -- The Edge Function will handle this part
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;