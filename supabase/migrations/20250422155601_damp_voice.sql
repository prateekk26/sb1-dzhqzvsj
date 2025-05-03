/*
  # Add new admin user to the system
  
  1. Changes
     - Update the is_admin_user function to include a new admin email
     - Add 'prateek.kurkanji@gmail.com' to the admin list
     
  2. Rationale
     - This allows the specified user to access admin features
     - Maintains security by using the existing admin check mechanism
*/

-- Update the is_admin_user function to include the new admin email
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  -- Add the new admin email to this array
  admin_emails text[] := ARRAY['prateekkurkanji@gmail.com', 'prateek.kurkanji@gmail.com'];
  current_email text;
BEGIN
  -- Get the current user's email
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  
  -- Check if the email is in the admin list
  RETURN current_email = ANY(admin_emails);
END;
$$;

-- Also update the is_user_admin function to include the new admin email
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  -- Add the new admin email to this array (keep in sync with is_admin_user)
  admin_emails text[] := ARRAY['prateekkurkanji@gmail.com', 'prateek.kurkanji@gmail.com'];
  user_email text;
BEGIN
  -- Get the user's email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Check if the email is in the admin list
  RETURN user_email = ANY(admin_emails);
END;
$$;

-- Add comments to explain the functions
COMMENT ON FUNCTION public.is_admin_user() IS 'Checks if the current user is an admin based on their email address';
COMMENT ON FUNCTION public.is_user_admin(UUID) IS 'Checks if a specific user is an admin based on their email address';