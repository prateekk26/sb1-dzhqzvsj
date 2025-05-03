/*
  # Fix mutable search path for get_all_references_with_users function
  
  1. Changes
     - Recreate the get_all_references_with_users function with a fixed search path
     - Add SECURITY DEFINER to ensure proper permissions
     - Set search_path explicitly to public, pg_catalog
     
  2. Rationale
     - Fixes security vulnerability from mutable search path
     - Ensures function always executes in the intended schema context
     - Follows security best practices for database functions
*/

-- Recreate the function with a fixed search path
CREATE OR REPLACE FUNCTION public.get_all_references_with_users()
RETURNS SETOF public.references
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY 
  SELECT r.*
  FROM public.references r
  JOIN auth.users u ON r.user_id = u.id
  LEFT JOIN public.users_profile p ON r.user_id = p.user_id
  ORDER BY r.created_at DESC;
END;
$$;