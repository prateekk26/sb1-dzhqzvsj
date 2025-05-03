/*
  # Add admin user management functions
  
  1. New Functions
    - `get_all_users` - Returns all users for admin viewing
    - `admin_delete_user` - Allows admins to delete users
    
  2. Security
    - Both functions are SECURITY DEFINER with fixed search paths
    - Both functions check if the caller is an admin
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