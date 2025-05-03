/*
  # Fix check_is_admin function with immutable search path
  
  1. Changes
     - Drop and recreate the check_is_admin function with a fixed search path
     - Ensure the function has proper security settings
     
  2. Rationale
     - Fixes the "function_search_path_mutable" warning
     - Improves security by preventing search path manipulation
*/

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.check_is_admin();

-- Recreate the function with a fixed search path
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT 
    COALESCE((raw_app_meta_data->>'is_admin')::boolean, false) INTO is_admin
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN is_admin;
END;
$$;