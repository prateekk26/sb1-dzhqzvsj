/*
  # Fix Security Issues in Database Functions
  
  1. Changes
     - Update all functions to use SECURITY DEFINER with explicit search_path
     - Fix is_admin_user function to properly check admin status
     - Ensure all functions have proper parameter handling
     
  2. Security Impact
     - Prevents search path injection attacks
     - Ensures functions run with proper permissions
     - Improves overall database security posture
*/

-- Fix update_updated_at_column function WITHOUT dropping it (has dependencies)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public, pg_catalog;

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Fix check_is_admin function
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

-- Fix set_user_admin function
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
      jsonb_set(raw_app_meta_data, '{is_admin}', 'false')
    END
  WHERE id = user_id;
END;
$$;

-- Fix get_all_references_with_users function
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

-- Fix cleanup_expired_tokens_trigger function
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens_trigger()
RETURNS trigger AS $$
BEGIN
  -- Delete expired tokens
  DELETE FROM interview_tokens WHERE expires_at < now();
  -- The trigger function must return something
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;