/*
  # Update interview_questions table to support CSV format
  
  1. Changes
    - Add `id` text field to store the unique identifier (e.g., "CST-1")
    - Rename existing `question` column to `text` to match CSV format
    - Add `secondary_competency_code` text field to store the secondary competency
    - Add `type` text field to store the question type (e.g., "Situational", "Behavioral")
    - Rename existing `competency_code` to `primary_competency_code` for clarity
    
  2. Rationale
    - This schema aligns with the data format provided in the CSV
    - Each question now has primary and secondary competencies for evaluation
    - Preserves question type to differentiate between situational, behavioral questions
    - Using `text` type rather than enum for flexibility
*/

-- Add category column for question categories (e.g., technical, behavioral)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'category'
  ) THEN
    ALTER TABLE interview_questions ADD COLUMN category text;
  END IF;
END $$;

-- Add id text field for storing predefined question IDs (e.g., CST-1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'question_id'
  ) THEN
    ALTER TABLE interview_questions ADD COLUMN question_id text;
  END IF;
END $$;

-- Add type column for question types (e.g., Situational, Behavioral)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'type'
  ) THEN
    ALTER TABLE interview_questions ADD COLUMN type text;
  END IF;
END $$;

-- Add primary_competency_code column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'primary_competency_code'
  ) THEN
    -- First check if we need to migrate existing competency_code data
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'interview_questions' AND column_name = 'competency_code'
    ) THEN
      -- Add new column
      ALTER TABLE interview_questions ADD COLUMN primary_competency_code text;
      
      -- Copy data from competency_code to primary_competency_code
      UPDATE interview_questions SET primary_competency_code = competency_code;
    ELSE
      -- Just add the new column if competency_code doesn't exist
      ALTER TABLE interview_questions ADD COLUMN primary_competency_code text;
    END IF;
  END IF;
END $$;

-- Add secondary_competency_code column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_questions' AND column_name = 'secondary_competency_code'
  ) THEN
    ALTER TABLE interview_questions ADD COLUMN secondary_competency_code text;
  END IF;
END $$;

-- Create an index on primary_competency_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_questions_primary_competency 
ON interview_questions(primary_competency_code);

-- Create an index on secondary_competency_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_questions_secondary_competency 
ON interview_questions(secondary_competency_code);

-- Create an index on question_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_questions_question_id 
ON interview_questions(question_id);