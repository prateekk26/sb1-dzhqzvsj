/*
  # Fix mutable search path for set_user_admin function
  
  1. Changes
     - Recreate the set_user_admin function with a fixed search path
     - Add SECURITY DEFINER to ensure proper permissions
     - Set search_path explicitly to public, pg_catalog
     
  2. Rationale
     - Fixes security vulnerability from mutable search path
     - Ensures function always executes in the intended schema context
     - Follows security best practices for database functions
*/

-- Recreate the function with a fixed search path
CREATE OR REPLACE FUNCTION public.set_user_admin(user_id uuid, is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    CASE WHEN $2 = true THEN 
      jsonb_set(raw_app_meta_data, '{is_admin}', 'true')
    ELSE
      raw_app_meta_data - 'is_admin'
    END
  WHERE id = $1;
END;
$$;