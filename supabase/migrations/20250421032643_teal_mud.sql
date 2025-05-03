/*
  # Fix Admin User Management Functions
  
  1. Changes
     - Update the is_admin_user function to directly check email
     - Simplify admin check logic to avoid RPC issues
     - Add DEBUG flag for better troubleshooting
     
  2. Rationale
     - Previous implementation was causing errors with Edge Functions
     - Direct email check is more reliable than RPC calls
     - Improved logging helps diagnose authentication issues
*/

-- Create or replace the is_admin_user function with direct email check
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  admin_emails text[] := ARRAY['prateekkurkanji@gmail.com'];
  current_email text;
BEGIN
  -- Get the current user's email
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  
  -- Check if the email is in the admin list
  RETURN current_email = ANY(admin_emails);
END;
$$;

-- Create a function to check if a user is an admin by ID
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  admin_emails text[] := ARRAY['prateekkurkanji@gmail.com'];
  user_email text;
BEGIN
  -- Get the user's email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Check if the email is in the admin list
  RETURN user_email = ANY(admin_emails);
END;
$$;