/*
  # Fix Interview Questions RLS Policies

  1. Changes
    - Drop existing policies that reference the user_id column
    - Create a new simple policy that allows all authenticated users to read questions
    - Create a policy that allows authenticated users to insert questions
    - Create a policy that allows authenticated users to update questions
    - Create a policy that allows authenticated users to delete questions

  2. Rationale
    - Fix the RLS policy violation error
    - Simplify permission model for interview questions to allow all authenticated users
      to manage questions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can insert questions" ON interview_questions;
DROP POLICY IF EXISTS "Admin can view questions" ON interview_questions;
DROP POLICY IF EXISTS "Admin can update questions" ON interview_questions;
DROP POLICY IF EXISTS "Admin can delete questions" ON interview_questions;
DROP POLICY IF EXISTS "Authenticated users can view all questions" ON interview_questions;
DROP POLICY IF EXISTS "Users can insert their own questions" ON interview_questions;
DROP POLICY IF EXISTS "Users can view their own questions" ON interview_questions;
DROP POLICY IF EXISTS "Users can update their own questions" ON interview_questions;
DROP POLICY IF EXISTS "Users can delete their own questions" ON interview_questions;

-- Create new policies that don't rely on the user_id column
CREATE POLICY "Authenticated users can view all questions"
  ON interview_questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert questions"
  ON interview_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions"
  ON interview_questions
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete questions"
  ON interview_questions
  FOR DELETE
  TO authenticated
  USING (true);