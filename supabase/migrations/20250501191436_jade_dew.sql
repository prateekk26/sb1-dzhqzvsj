/*
  # Create interview_reviews table and related functions
  
  1. New Tables
    - `interview_reviews`
      - Stores anonymous interview experiences
      - Tracks company behavior, interview process details, and salary information
      - Supports moderation workflow

  2. Security
    - Enable RLS
    - Add policies for anonymous submissions
    - Add policies for viewing approved reviews
    - Add policies for admin management
    
  3. Analytics Functions
    - Functions to identify top ghosting companies
    - Functions to identify most respectful companies
    - Functions for tag analysis
*/

-- Create interview_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS interview_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id uuid,
  company_name text NOT NULL,
  role_title text,
  stage text NOT NULL,
  was_ghosted boolean,
  interviewer_attitude text,
  gave_feedback boolean,
  had_assignment boolean,
  assignment_duration text,
  previous_salary text,
  expected_salary text,
  offered_salary text,
  comments text,
  moderation_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE interview_reviews ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_interview_reviews_updated_at'
    AND tgrelid = 'interview_reviews'::regclass
  ) THEN
    CREATE TRIGGER update_interview_reviews_updated_at
    BEFORE UPDATE ON interview_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create policies for interview_reviews, only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous submissions' AND tablename = 'interview_reviews') THEN
        CREATE POLICY "Allow anonymous submissions" ON interview_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own reviews' AND tablename = 'interview_reviews') THEN
        CREATE POLICY "Users can view their own reviews" ON interview_reviews FOR SELECT TO authenticated USING (
            user_id = auth.uid() OR 
            (session_id IS NOT NULL AND session_id::text = COALESCE(NULLIF(((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text), ''::text), 'none'::text))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view approved reviews' AND tablename = 'interview_reviews') THEN
        CREATE POLICY "Public can view approved reviews" ON interview_reviews FOR SELECT TO anon, authenticated USING (moderation_status = 'approved');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all reviews' AND tablename = 'interview_reviews') THEN
        CREATE POLICY "Admins can manage all reviews" ON interview_reviews FOR ALL TO authenticated USING (is_admin_user());
    END IF;
END$$;

-- Create index on company_name for faster searches
CREATE INDEX IF NOT EXISTS idx_interview_reviews_company_name
  ON interview_reviews(company_name);

-- Create index on moderation_status for filtering
CREATE INDEX IF NOT EXISTS idx_interview_reviews_moderation_status
  ON interview_reviews(moderation_status);

-- Create function to get top ghosting companies
CREATE OR REPLACE FUNCTION get_top_ghosting_companies(limit_count integer DEFAULT 5)
RETURNS TABLE (
  company_name text,
  ghost_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ir.company_name,
    COUNT(*) as ghost_count
  FROM 
    interview_reviews ir
  WHERE 
    ir.was_ghosted = true
    AND ir.moderation_status = 'approved'
  GROUP BY 
    ir.company_name
  ORDER BY 
    ghost_count DESC
  LIMIT 
    limit_count;
END;
$$;

-- Create function to get most respectful companies
CREATE OR REPLACE FUNCTION get_most_respectful_companies(limit_count integer DEFAULT 5)
RETURNS TABLE (
  company_name text,
  respect_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ir.company_name,
    ROUND(
      (COUNT(*) FILTER (WHERE ir.interviewer_attitude IN ('respectful', 'friendly'))::numeric / 
       NULLIF(COUNT(*), 0)::numeric) * 100
    ) as respect_score
  FROM 
    interview_reviews ir
  WHERE 
    ir.moderation_status = 'approved'
    AND ir.interviewer_attitude IS NOT NULL
  GROUP BY 
    ir.company_name
  HAVING
    COUNT(*) >= 3  -- Require at least 3 reviews for statistical significance
  ORDER BY 
    respect_score DESC
  LIMIT 
    limit_count;
END;
$$;

-- Create function to get popular tags from comments
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count integer DEFAULT 10)
RETURNS TABLE (
  tag text,
  count bigint,
  sentiment text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- This is a placeholder function that would normally use text analysis
  -- In a real implementation, this would use a more sophisticated approach
  RETURN QUERY
  SELECT 
    'Placeholder'::text as tag,
    0::bigint as count,
    'neutral'::text as sentiment
  LIMIT limit_count;
END;
$$;