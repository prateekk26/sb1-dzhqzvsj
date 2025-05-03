/*
  # Create references table and related functionality
  
  1. New Tables
    - `references`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `referee_name` (text)
      - `referee_email` (text)
      - `referee_phone` (text, nullable)
      - `relationship` (text)
      - `company` (text)
      - `linkedin_url` (text, nullable)
      - `status` (text - pending, sent, completed, declined)
      - `feedback` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `sent_at` (timestamptz, nullable)
      - `completed_at` (timestamptz, nullable)
    
    - `reference_tokens`
      - `id` (uuid, primary key)
      - `reference_id` (uuid, references references)
      - `token` (text)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `reference_questions`
      - `id` (uuid, primary key)
      - `question` (text)
      - `sort_order` (integer)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `reference_answers`
      - `id` (uuid, primary key)
      - `reference_id` (uuid, references references)
      - `question_id` (uuid, references reference_questions)
      - `answer` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own references
    - Add policies for admin access
    - Add policies for public access to reference submission
    
  3. Default Data
    - Add default reference questions
*/

-- Create references table with explicit public schema to avoid keyword issues
CREATE TABLE IF NOT EXISTS public.references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referee_name text NOT NULL,
  referee_email text NOT NULL,
  referee_phone text,
  relationship text NOT NULL, -- e.g., "manager", "colleague", "stakeholder"
  company text NOT NULL, -- company where they worked together
  linkedin_url text,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, completed, declined
  feedback text, -- the reference feedback content after submission
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sent_at timestamptz, -- when the request was sent to the referee
  completed_at timestamptz -- when the feedback was provided
);

-- Enable Row Level Security (if not already enabled)
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Only create the trigger if it doesn't already exist
-- This fixes the "trigger already exists" error
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_references_updated_at' 
    AND tgrelid = 'public.references'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER update_references_updated_at
    BEFORE UPDATE ON public.references
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
END
$$;

-- Create policies for references (only if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can insert their own references'
    AND tablename = 'references'
  ) THEN
    CREATE POLICY "Users can insert their own references"
      ON public.references
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can view their own references'
    AND tablename = 'references'
  ) THEN
    CREATE POLICY "Users can view their own references"
      ON public.references
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can update their own pending references'
    AND tablename = 'references'
  ) THEN
    CREATE POLICY "Users can update their own pending references"
      ON public.references
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id AND status = 'pending')
      WITH CHECK (auth.uid() = user_id AND status = 'pending');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can delete their own pending references'
    AND tablename = 'references'
  ) THEN
    CREATE POLICY "Users can delete their own pending references"
      ON public.references
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id AND status = 'pending');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admin can manage all references'
    AND tablename = 'references'
  ) THEN
    CREATE POLICY "Admin can manage all references"
      ON public.references
      FOR ALL
      TO authenticated
      USING (is_admin_user());
  END IF;
END
$$;

-- Create reference_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reference_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.references(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reference_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for reference_tokens (only if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admin can access reference tokens'
    AND tablename = 'reference_tokens'
  ) THEN
    CREATE POLICY "Admin can access reference tokens"
      ON public.reference_tokens
      FOR ALL
      TO authenticated
      USING (is_admin_user());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Anyone can verify reference tokens'
    AND tablename = 'reference_tokens'
  ) THEN
    CREATE POLICY "Anyone can verify reference tokens"
      ON public.reference_tokens
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END
$$;

-- Create reference_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reference_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  sort_order int NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reference_questions ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at on reference_questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_reference_questions_updated_at' 
    AND tgrelid = 'public.reference_questions'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER update_reference_questions_updated_at
    BEFORE UPDATE ON public.reference_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
END
$$;

-- Create policies for reference_questions (only if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admin can manage reference questions'
    AND tablename = 'reference_questions'
  ) THEN
    CREATE POLICY "Admin can manage reference questions"
      ON public.reference_questions
      FOR ALL
      TO authenticated
      USING (is_admin_user());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Anyone can view active reference questions'
    AND tablename = 'reference_questions'
  ) THEN
    CREATE POLICY "Anyone can view active reference questions"
      ON public.reference_questions
      FOR SELECT
      TO anon, authenticated
      USING (active = true);
  END IF;
END
$$;

-- Create reference_answers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reference_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.references(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.reference_questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reference_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for reference_answers (only if they don't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can view their own reference answers'
    AND tablename = 'reference_answers'
  ) THEN
    CREATE POLICY "Users can view their own reference answers"
      ON public.reference_answers
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.references 
        WHERE public.references.id = reference_answers.reference_id
        AND public.references.user_id = auth.uid()
      ));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Admins can view all reference answers'
    AND tablename = 'reference_answers'
  ) THEN
    CREATE POLICY "Admins can view all reference answers"
      ON public.reference_answers
      FOR SELECT
      TO authenticated
      USING (is_admin_user());
  END IF;
END
$$;

-- Create or replace function to get all references with user information
-- Using RETURNS SETOF instead of custom return type for compatibility
CREATE OR REPLACE FUNCTION public.get_all_references_with_users()
RETURNS SETOF public.references
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Insert default reference questions (only if they don't already exist)
INSERT INTO public.reference_questions (id, question, sort_order, active, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'How long have you known the candidate and in what capacity?',
  1, 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_questions 
  WHERE question = 'How long have you known the candidate and in what capacity?'
);

INSERT INTO public.reference_questions (id, question, sort_order, active, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'What are the candidate''s greatest strengths in a professional context?',
  2, 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_questions 
  WHERE question = 'What are the candidate''s greatest strengths in a professional context?'
);

INSERT INTO public.reference_questions (id, question, sort_order, active, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'Can you describe a specific project or achievement where the candidate excelled?',
  3, 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_questions 
  WHERE question = 'Can you describe a specific project or achievement where the candidate excelled?'
);

INSERT INTO public.reference_questions (id, question, sort_order, active, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'How would you rate the candidate''s technical skills relevant to their role?',
  4, 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_questions 
  WHERE question = 'How would you rate the candidate''s technical skills relevant to their role?'
);

INSERT INTO public.reference_questions (id, question, sort_order, active, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'How would you describe the candidate''s communication and interpersonal skills?',
  5, 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_questions 
  WHERE question = 'How would you describe the candidate''s communication and interpersonal skills?'
);

INSERT INTO public.reference_questions (id, question, sort_order, active, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'What areas could the candidate improve upon professionally?',
  6, 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_questions 
  WHERE question = 'What areas could the candidate improve upon professionally?'
);

INSERT INTO public.reference_questions (id, question, sort_order, active, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'Would you recommend this candidate for employment? Why or why not?',
  7, 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_questions 
  WHERE question = 'Would you recommend this candidate for employment? Why or why not?'
);

INSERT INTO public.reference_questions (id, question, sort_order, active, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'Is there anything else prospective employers should know about this candidate?',
  8, 
  true, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.reference_questions 
  WHERE question = 'Is there anything else prospective employers should know about this candidate?'
);