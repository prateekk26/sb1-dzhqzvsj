/*
  # Fix mutable search path for update_updated_at_column function
  
  1. Changes
     - Recreate the update_updated_at_column function with a fixed search path
     - Add SECURITY DEFINER to ensure proper permissions
     - Set search_path explicitly to public, pg_catalog
     
  2. Rationale
     - Fixes security vulnerability from mutable search path
     - Ensures function always executes in the intended schema context
     - Follows security best practices for database functions
*/

-- Recreate the function with a fixed search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;