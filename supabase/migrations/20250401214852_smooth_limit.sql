/*
  # Remove answer column from interview_questions table
  
  1. Changes
     - Remove the unnecessary `answer` column from the `interview_questions` table
     
  2. Rationale
     - The answer column is not needed for the current application architecture
     - Removing it simplifies the schema and resolves conflicts
*/

-- Safely remove the answer column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'answer'
  ) THEN
    ALTER TABLE interview_questions DROP COLUMN answer;
  END IF;
END $$;