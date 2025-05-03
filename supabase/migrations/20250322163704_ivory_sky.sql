/*
  # Create experiences table

  1. New Tables
    - `experiences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users.id)
      - `company` (text, not null)
      - `role` (text, not null)
      - `location` (text, null)
      - `start_date` (date, not null)
      - `end_date` (date, null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `experiences` table
    - Add policies for users to manage their own experiences
*/

CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Create trigger to update updated_at on update
CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON experiences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Policies for row-level security
-- Users can insert their own experiences
CREATE POLICY "Users can insert their own experiences"
  ON experiences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own experiences
CREATE POLICY "Users can view their own experiences"
  ON experiences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own experiences
CREATE POLICY "Users can update their own experiences"
  ON experiences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own experiences
CREATE POLICY "Users can delete their own experiences"
  ON experiences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);