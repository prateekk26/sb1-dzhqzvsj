/*
  # Create interview_reviews table for Truth Wall
  
  1. New Tables
    - `interview_reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable)
      - `session_id` (uuid, for anonymous submissions)
      - `company_name` (text, not null)
      - `role_title` (text)
      - `stage` (text, not null)
      - `was_ghosted` (boolean)
      - `interviewer_attitude` (text)
      - `gave_feedback` (boolean)
      - `had_assignment` (boolean)
      - `assignment_duration` (text)
      - `previous_salary` (text)
      - `expected_salary` (text)
      - `offered_salary` (text)
      - `comments` (text)
      - `moderation_status` (text, default 'pending')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for anonymous submissions
    - Add policies for admin moderation
*/

-- Create interview_reviews table
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

-- Create trigger for updated_at
CREATE TRIGGER update_interview_reviews_updated_at
BEFORE UPDATE ON interview_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create policies for interview_reviews
-- Allow anyone to insert reviews (anonymous submissions)
CREATE POLICY "Allow anonymous submissions"
  ON interview_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view their own reviews
CREATE POLICY "Users can view their own reviews"
  ON interview_reviews
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    (session_id IS NOT NULL AND session_id::text = coalesce(nullif(current_setting('request.headers', true)::json->>'x-session-id', ''), 'none'))
  );

-- Allow public to view approved reviews
CREATE POLICY "Public can view approved reviews"
  ON interview_reviews
  FOR SELECT
  TO anon, authenticated
  USING (moderation_status = 'approved');

-- Allow admins to manage all reviews
CREATE POLICY "Admins can manage all reviews"
  ON interview_reviews
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Create index on company_name for faster searches
CREATE INDEX idx_interview_reviews_company_name
  ON interview_reviews(company_name);

-- Create index on moderation_status for filtering
CREATE INDEX idx_interview_reviews_moderation_status
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