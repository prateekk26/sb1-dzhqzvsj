/*
  # Create interview_tokens table and cleanup trigger
  
  1. New Tables
    - `interview_tokens`
      - `id` (uuid, primary key)
      - `token` (text, unique)
      - `user_id` (uuid, references auth.users)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS
    - Add policies for token validation
    - Add trigger for automatic cleanup of expired tokens
*/

-- Create the interview_tokens table
CREATE TABLE IF NOT EXISTS interview_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE interview_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow token validation
CREATE POLICY "Allow token validation"
  ON interview_tokens
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    expires_at > now()
  );

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens_trigger()
RETURNS trigger AS $$
BEGIN
  -- Delete expired tokens
  DELETE FROM interview_tokens WHERE expires_at < now();
  -- The trigger function must return something
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up expired tokens
DROP TRIGGER IF EXISTS cleanup_expired_tokens_trigger ON interview_tokens;
CREATE TRIGGER cleanup_expired_tokens_trigger
  AFTER INSERT ON interview_tokens
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_tokens_trigger();