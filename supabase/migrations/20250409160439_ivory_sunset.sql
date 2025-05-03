/*
  # Fix set_user_admin function with immutable search path
  
  1. Changes
     - Drop and recreate the set_user_admin function with a fixed search path
     - Ensure the function has proper security settings
     
  2. Rationale
     - Fixes the "function_search_path_mutable" warning
     - Improves security by preventing search path manipulation
*/

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.set_user_admin(uuid, boolean);

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
    CASE WHEN is_admin = true THEN 
      jsonb_set(raw_app_meta_data, '{is_admin}', 'true')
    ELSE
      raw_app_meta_data - 'is_admin'
    END
  WHERE id = user_id;
END;
$$;