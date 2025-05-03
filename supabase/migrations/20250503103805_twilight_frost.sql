/*
  # Update is_admin_user function to check role column
  
  1. Changes
     - Modify the is_admin_user function to check the role column in users_profile
     - Fall back to email check for backward compatibility
     - Add proper error handling
     
  2. Rationale
     - This allows managing admin access through the role column
     - Maintains compatibility with existing admin users
     - Improves security by handling errors gracefully
*/

-- Create or replace the is_admin_user function to check role column
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  admin_emails text[] := ARRAY['prateekkurkanji@gmail.com', 'prateek.kurkanji@gmail.com'];
  current_email text;
  user_role text;
  current_user_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- First check if the user has role='admin' in users_profile
  SELECT role INTO user_role
  FROM users_profile
  WHERE user_id = current_user_id;
  
  -- If role is 'admin', return true
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Fallback to email check for backward compatibility
  SELECT email INTO current_email 
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Check if the email is in the admin list
  RETURN current_email = ANY(admin_emails);
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (this will appear in the Supabase logs)
    RAISE WARNING 'Error in is_admin_user function: %', SQLERRM;
    -- Return false on any error to fail securely
    RETURN false;
END;
$$;

-- Add comment to explain the function
COMMENT ON FUNCTION public.is_admin_user() IS 'Checks if the current user is an admin based on role column or email';