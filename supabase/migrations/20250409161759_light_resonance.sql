-- Fix cleanup_expired_tokens_trigger function (drop trigger first, then function)
DROP TRIGGER IF EXISTS cleanup_expired_tokens_trigger ON public.interview_tokens;

-- Now drop the function
DROP FUNCTION IF EXISTS public.cleanup_expired_tokens_trigger();

-- Recreate the function with a fixed search path
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens_trigger()
RETURNS trigger AS $$
BEGIN
  -- Delete expired tokens
  DELETE FROM interview_tokens WHERE expires_at < now();
  -- The trigger function must return something
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Recreate the trigger after the function is updated
CREATE TRIGGER cleanup_expired_tokens_trigger
  AFTER INSERT ON public.interview_tokens
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_tokens_trigger();

-- Fix update_updated_at_column function WITHOUT dropping it (has dependencies)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public, pg_catalog;

-- Drop dependent policies before dropping the function
DROP POLICY IF EXISTS "Admin can insert questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Admin can update questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Admin can delete questions" ON public.interview_questions;
DROP POLICY IF EXISTS "Admin can manage all references" ON public.references;
DROP POLICY IF EXISTS "Admin can access reference tokens" ON public.reference_tokens;
DROP POLICY IF EXISTS "Admin can manage reference questions" ON public.reference_questions;
DROP POLICY IF EXISTS "Admins can view all reference answers" ON public.reference_answers;

-- Now drop the function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Recreate the function with a fixed search path
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

-- Recreate the policies that depend on is_admin_user()
CREATE POLICY "Admin can insert questions"
  ON public.interview_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update questions" 
  ON public.interview_questions
  FOR UPDATE
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admin can delete questions"
  ON public.interview_questions
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admin can manage all references"
  ON public.references
  FOR ALL
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admin can access reference tokens"
  ON public.reference_tokens
  FOR ALL
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admin can manage reference questions"
  ON public.reference_questions
  FOR ALL
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can view all reference answers"
  ON public.reference_answers
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

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