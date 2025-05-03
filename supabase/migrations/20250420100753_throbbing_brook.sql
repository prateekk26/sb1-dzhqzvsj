/*
  # Fix auth functions for user management
  
  1. Changes
     - Update the get_all_users function to return more user information
     - Fix the admin_delete_user function to properly handle user deletion
     
  2. Rationale
     - Improves the admin user management interface
     - Ensures proper user deletion with appropriate error handling
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_all_users();
DROP FUNCTION IF EXISTS public.admin_delete_user(UUID);

-- Create improved function to get all users with more information
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB
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
  
  -- Return selected user fields
  RETURN QUERY 
  SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.raw_app_meta_data,
    u.raw_user_meta_data
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Create improved function to delete a user
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id UUID)
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
  
  -- Delete the user from auth.users
  -- This will cascade to all related data due to foreign key constraints
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;