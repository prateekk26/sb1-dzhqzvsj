/*
  # Create interview questions table and storage bucket

  1. New Tables
    - `interview_questions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `question` (text, not null)
      - `answer` (text, nullable)
      - `category` (text, nullable)
      - `competency_code` (text, nullable)
      - `difficulty` (text, nullable)
      - `tags` (text[], nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `interview_questions` table
    - Add policies for users to manage their own questions
*/

-- Create the interview_questions table
CREATE TABLE IF NOT EXISTS interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  competency_code text,
  difficulty text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- Function to create or replace the update_updated_at_column trigger
CREATE OR REPLACE FUNCTION create_update_interview_questions_trigger()
RETURNS VOID AS $$
BEGIN
  -- Check if the trigger already exists
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interview_questions_updated_at' AND tgrelid = 'interview_questions'::regclass) THEN
    -- If the trigger exists, drop it
    DROP TRIGGER update_interview_questions_updated_at ON interview_questions;
  END IF;

  -- Create the trigger
  CREATE TRIGGER update_interview_questions_updated_at
  BEFORE UPDATE ON interview_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create or replace the trigger
SELECT create_update_interview_questions_trigger();

-- Policies for row-level security
-- Users can insert their own questions
CREATE POLICY IF NOT EXISTS "Users can insert their own questions"
  ON interview_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own questions
CREATE POLICY IF NOT EXISTS "Users can view their own questions"
  ON interview_questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own questions
CREATE POLICY IF NOT EXISTS "Users can update their own questions"
  ON interview_questions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own questions
CREATE POLICY IF NOT EXISTS "Users can delete their own questions"
  ON interview_questions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
