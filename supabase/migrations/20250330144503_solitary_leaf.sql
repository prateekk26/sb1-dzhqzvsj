/*
  # Mock Interviews Schema

  1. New Tables
    - `mock_interviews`
      - Stores mock interview sessions and results
      - Tracks competency scores and feedback
      - Records audio transcripts and analysis

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  competency_scores jsonb,
  feedback text,
  transcript text,
  audio_url text,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own mock interviews"
  ON mock_interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own mock interviews"
  ON mock_interviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mock interviews"
  ON mock_interviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated trigger
CREATE TRIGGER update_mock_interviews_updated_at
  BEFORE UPDATE ON mock_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();