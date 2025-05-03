/*
  # Create references table and related objects
  
  This migration creates tables for managing professional references including:
  - professional references table (properly escaped since references is a reserved keyword)
  - reference tokens table for secure access
  - reference questions table for standard questions
  - reference answers table to store responses
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

-- Enable Row Level Security
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_references_updated_at
BEFORE UPDATE ON public.references
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create policy for references
-- Users can create references
CREATE POLICY "Users can create their own references"
  ON public.references
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own references
CREATE POLICY "Users can view their own references"
  ON public.references
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own pending references
CREATE POLICY "Users can update their own pending references"
  ON public.references
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending references
CREATE POLICY "Users can delete their own pending references"
  ON public.references
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Admin can manage all references
CREATE POLICY "Admin can manage all references"
  ON public.references
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Create references_token table for secure access
CREATE TABLE IF NOT EXISTS public.reference_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.references(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reference_tokens ENABLE ROW LEVEL SECURITY;

-- Admin access to reference tokens
CREATE POLICY "Admin can access reference tokens"
  ON public.reference_tokens
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Public access to verify tokens (for reference submission page)
CREATE POLICY "Anyone can verify reference tokens"
  ON public.reference_tokens
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create reference_questions table to store standard questions
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

-- Admin can manage reference questions
CREATE POLICY "Admin can manage reference questions"
  ON public.reference_questions
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Anyone can view active reference questions
CREATE POLICY "Anyone can view active reference questions"
  ON public.reference_questions
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Create reference_answers table to store responses to questions
CREATE TABLE IF NOT EXISTS public.reference_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.references(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.reference_questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reference_answers ENABLE ROW LEVEL SECURITY;

-- Users can view their own reference answers
CREATE POLICY "Users can view their own reference answers"
  ON public.reference_answers
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.references 
    WHERE public.references.id = reference_answers.reference_id
    AND public.references.user_id = auth.uid()
  ));

-- Admins can view all reference answers
CREATE POLICY "Admins can view all reference answers"
  ON public.reference_answers
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Create function to get all references with user information
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

-- Insert default reference questions
INSERT INTO public.reference_questions (id, question, sort_order, active)
VALUES 
  (gen_random_uuid(), 'How long have you known the candidate and in what capacity?', 1, true),
  (gen_random_uuid(), 'What are the candidate''s greatest strengths in a professional context?', 2, true),
  (gen_random_uuid(), 'Can you describe a specific project or achievement where the candidate excelled?', 3, true),
  (gen_random_uuid(), 'How would you rate the candidate''s technical skills relevant to their role?', 4, true),
  (gen_random_uuid(), 'How would you describe the candidate''s communication and interpersonal skills?', 5, true),
  (gen_random_uuid(), 'What areas could the candidate improve upon professionally?', 6, true),
  (gen_random_uuid(), 'Would you recommend this candidate for employment? Why or why not?', 7, true),
  (gen_random_uuid(), 'Is there anything else prospective employers should know about this candidate?', 8, true)
ON CONFLICT DO NOTHING;