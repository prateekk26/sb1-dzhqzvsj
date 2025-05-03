/*
  # Fix mutable search path for cleanup_expired_tokens_trigger function
  
  1. Changes
     - Recreate the cleanup_expired_tokens_trigger function with a fixed search path
     - Add SECURITY DEFINER to ensure proper permissions
     - Set search_path explicitly to public, pg_catalog
     
  2. Rationale
     - Fixes security vulnerability from mutable search path
     - Ensures function always executes in the intended schema context
     - Follows security best practices for database functions
*/

-- Recreate the function with a fixed search path
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Delete expired tokens
  DELETE FROM interview_tokens WHERE expires_at < now();
  -- The trigger function must return something
  RETURN NEW;
END;
$$;