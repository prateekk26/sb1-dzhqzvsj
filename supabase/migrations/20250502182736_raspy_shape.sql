/*
  # Update is_admin_user function to use Supabase roles
  
  1. Changes
     - Modify the is_admin_user function to check for the 'admin' role in auth.users
     - Remove hardcoded email addresses for better security
     - Add proper error handling and logging
     
  2. Rationale
     - Using Supabase roles is more secure than hardcoded email addresses
     - Makes admin management more scalable through role-based access control
     - Follows security best practices for database functions
*/

-- Create or replace the is_admin_user function to check for admin role
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  is_admin boolean;
  current_user_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the user has the admin role in their app_metadata
  SELECT 
    COALESCE((raw_app_meta_data->>'is_admin')::boolean, false) INTO is_admin
  FROM 
    auth.users
  WHERE 
    id = current_user_id;
  
  -- Return the result
  RETURN is_admin;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (this will appear in the Supabase logs)
    RAISE WARNING 'Error in is_admin_user function: %', SQLERRM;
    -- Return false on any error to fail securely
    RETURN false;
END;
$$;

-- Create or replace the is_user_admin function to check if a specific user is an admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- If no user ID is provided, return false
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the user has the admin role in their app_metadata
  SELECT 
    COALESCE((raw_app_meta_data->>'is_admin')::boolean, false) INTO is_admin
  FROM 
    auth.users
  WHERE 
    id = user_id;
  
  -- Return the result
  RETURN is_admin;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error in is_user_admin function: %', SQLERRM;
    -- Return false on any error to fail securely
    RETURN false;
END;
$$;

-- Create a function to set a user as admin (for use by other admin users)
CREATE OR REPLACE FUNCTION public.set_user_admin_role(target_user_id UUID, make_admin boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  current_user_id uuid;
  current_user_is_admin boolean;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  -- Check if the current user is an admin
  SELECT is_admin_user() INTO current_user_is_admin;
  
  -- Only allow admins to set other users as admins
  IF NOT current_user_is_admin THEN
    RAISE EXCEPTION 'Only administrators can modify admin roles';
  END IF;
  
  -- Update the user's app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = 
    CASE WHEN make_admin = true THEN 
      jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{is_admin}', 'true'::jsonb)
    ELSE
      jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{is_admin}', 'false'::jsonb)
    END
  WHERE id = target_user_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in set_user_admin_role function: %', SQLERRM;
    RETURN false;
END;
$$;

-- Add comments to explain the functions
COMMENT ON FUNCTION public.is_admin_user() IS 'Checks if the current user has admin role based on app_metadata';
COMMENT ON FUNCTION public.is_user_admin(UUID) IS 'Checks if a specific user has admin role based on app_metadata';
COMMENT ON FUNCTION public.set_user_admin_role(UUID, boolean) IS 'Sets or removes admin role for a user (admin users only)';