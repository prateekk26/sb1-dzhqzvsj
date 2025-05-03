/*
  # Create upcoming interviews table and related functionality
  
  1. New Tables
    - `interviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `company` (text)
      - `position` (text)
      - `date` (timestamptz)
      - `type` (text) - e.g., 'technical', 'behavioral', 'system design'
      - `status` (text) - e.g., 'scheduled', 'completed', 'cancelled'
      - `notes` (text)
      - `location` (text) - can be physical address or virtual meeting link
      - `interviewer` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for users to manage their own interviews
*/

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  date timestamptz NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  location text,
  interviewer text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add constraint to validate status
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  
  -- Add constraint to validate type
  CONSTRAINT valid_type CHECK (type IN ('technical', 'behavioral', 'system design', 'cultural', 'other'))
);

-- Enable Row Level Security
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Create trigger for updating updated_at
CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Policies for row-level security
-- Users can insert their own interviews
CREATE POLICY "Users can insert their own interviews"
  ON interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own interviews
CREATE POLICY "Users can view their own interviews"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own interviews
CREATE POLICY "Users can update their own interviews"
  ON interviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interviews
CREATE POLICY "Users can delete their own interviews"
  ON interviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);