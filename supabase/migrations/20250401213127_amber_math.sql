/*
  # Modify interview questions table schema
  
  1. Changes
     - Make user_id optional since questions are uploaded by admins
     - Update policies to allow admin access
     - Rename competency_code to primary_competency_code (if not already done)
     - Make columns optional: answer, tags, category
  
  2. Rationale
     - Questions will be centrally managed by admin users
     - Supporting new structure with primary and secondary competencies
     - Making fields optional for more flexible question management
*/

-- Make user_id optional by removing the NOT NULL constraint
ALTER TABLE interview_questions ALTER COLUMN user_id DROP NOT NULL;

-- Make sure all the new columns are present (these were added in previous migration but checking for safety)
DO $$
BEGIN
  -- Ensure primary_competency_code exists (migrating from competency_code if needed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'competency_code'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'primary_competency_code'
  ) THEN
    ALTER TABLE interview_questions ADD COLUMN primary_competency_code text;
    UPDATE interview_questions SET primary_competency_code = competency_code;
  END IF;

  -- Ensure secondary_competency_code exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'secondary_competency_code'
  ) THEN
    ALTER TABLE interview_questions ADD COLUMN secondary_competency_code text;
  END IF;
  
  -- Ensure type column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'type'
  ) THEN
    ALTER TABLE interview_questions ADD COLUMN type text;
  END IF;
  
  -- Ensure question_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'question_id'
  ) THEN
    ALTER TABLE interview_questions ADD COLUMN question_id text;
  END IF;
END $$;

-- Create index on question_id if not exists
CREATE INDEX IF NOT EXISTS idx_interview_questions_question_id 
ON interview_questions(question_id);

-- Create index on primary_competency_code if not exists  
CREATE INDEX IF NOT EXISTS idx_interview_questions_primary_competency 
ON interview_questions(primary_competency_code);

-- Create index on secondary_competency_code if not exists
CREATE INDEX IF NOT EXISTS idx_interview_questions_secondary_competency 
ON interview_questions(secondary_competency_code);

-- Update or create policies for admin user access
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS boolean AS $$
BEGIN
  RETURN auth.email() = 'prateekkurkanji@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can insert their own questions" ON interview_questions;
DROP POLICY IF EXISTS "Users can view their own questions" ON interview_questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON interview_questions;
DROP POLICY IF EXISTS "Users can delete their own questions" ON interview_questions;

-- Create policies for admin access
CREATE POLICY "Admin can insert questions"
  ON interview_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user() OR auth.uid() = user_id);

CREATE POLICY "Admin can view questions"
  ON interview_questions
  FOR SELECT
  TO authenticated
  USING (is_admin_user() OR auth.uid() = user_id);

CREATE POLICY "Admin can update questions" 
  ON interview_questions
  FOR UPDATE
  TO authenticated
  USING (is_admin_user() OR auth.uid() = user_id)
  WITH CHECK (is_admin_user() OR auth.uid() = user_id);

CREATE POLICY "Admin can delete questions"
  ON interview_questions
  FOR DELETE
  TO authenticated
  USING (is_admin_user() OR auth.uid() = user_id);

-- Create policy for all authenticated users to select questions
CREATE POLICY "Authenticated users can view all questions"
  ON interview_questions
  FOR SELECT
  TO authenticated
  USING (true);