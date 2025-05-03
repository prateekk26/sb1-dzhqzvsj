/*
  # Add job_description column to interviews table
  
  1. Changes
    - Add job_description field to store raw job description text
    - This allows us to remember and reference the job description for future analyses
*/

-- Add job_description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'job_description'
  ) THEN
    ALTER TABLE interviews ADD COLUMN job_description text;
  END IF;
END $$;