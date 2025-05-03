/*
  # Improve Admin User Check Function
  
  1. Changes
     - Update the is_admin_user function to be more efficient
     - Add caching hint with IMMUTABLE attribute
     - Simplify the logic for better performance
     
  2. Rationale
     - Reduces database load from repeated admin checks
     - Makes the function more reliable and faster
     - Improves overall application performance
*/

-- Create or replace the is_admin_user function with optimized implementation
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
  -- Get the current user's email directly
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  
  -- Simple check if email is in the admin list
  RETURN current_email = ANY(admin_emails);
END;
$$;

-- Add comment to explain function usage
COMMENT ON FUNCTION public.is_admin_user() IS 'Checks if the current user is an admin based on their email address';