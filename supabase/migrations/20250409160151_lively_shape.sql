/*
  # Fix mutable search path for check_is_admin function
  
  1. Changes
     - Recreate the check_is_admin function with a fixed search path
     - Add SECURITY DEFINER to ensure proper permissions
     - Set search_path explicitly to public, pg_catalog
     
  2. Rationale
     - Fixes security vulnerability from mutable search path
     - Ensures function always executes in the intended schema context
     - Follows security best practices for database functions
*/

-- Recreate the function with a fixed search path
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  admin_emails text[] := ARRAY['prateekkurkanji@gmail.com'];
  current_email text;
BEGIN
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();

  IF current_email IS NOT NULL THEN
    RETURN current_email = ANY(admin_emails);
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;