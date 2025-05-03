/*
  # Add admin_delete_user function for user management
  
  1. New Functions
    - `admin_delete_user` - RPC function to delete a user and their data
    - `get_all_users` - RPC function to get all users in the system
  
  2. Security
    - Both functions use SECURITY DEFINER to run with elevated privileges
    - Both functions have fixed search paths to prevent injection attacks
    - Access is restricted to admin users only
*/

-- Create function to get all users
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS SETOF auth.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only administrators can access user data';
  END IF;
  
  -- Return all users
  RETURN QUERY SELECT * FROM auth.users ORDER BY created_at DESC;
END;
$$;

-- Create function to delete a user
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;
  
  -- Delete the user from auth.users
  -- This will cascade to all related data due to foreign key constraints
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;