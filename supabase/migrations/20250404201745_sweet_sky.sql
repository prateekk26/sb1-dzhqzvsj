/*
  # Update mock_interviews table for grading and feedback

  1. Changes
     - Add columns for storing detailed interview results:
       - `competencies_assessed` - array of competency codes covered in the interview
       - `competency_scores` - JSONB field to store detailed scoring
       - `overall_score` - numeric field for the final weighted score (1-10)
       - `grading_completed_at` - timestamp when grading was completed
       - `grading_status` - text tracking grading process status

  2. Rationale
     - Enable storing detailed interview analysis
     - Support multiple competencies per interview
     - Allow for weighted scoring across competencies
     - Track the grading process status
*/

-- Add new columns for grading data if they don't exist
DO $$
BEGIN
  -- Add competency_scores column (JSONB for flexible storage of complex scoring data)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mock_interviews' AND column_name = 'competency_scores'
  ) THEN
    ALTER TABLE mock_interviews ADD COLUMN competency_scores jsonb;
  END IF;

  -- Add overall_score column (stores final weighted score)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mock_interviews' AND column_name = 'overall_score'
  ) THEN
    ALTER TABLE mock_interviews ADD COLUMN overall_score numeric(3,1);
  END IF;

  -- Add grading_completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mock_interviews' AND column_name = 'grading_completed_at'
  ) THEN
    ALTER TABLE mock_interviews ADD COLUMN grading_completed_at timestamptz;
  END IF;

  -- Add grading_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mock_interviews' AND column_name = 'grading_status'
  ) THEN
    ALTER TABLE mock_interviews ADD COLUMN grading_status text;
  END IF;
  
  -- Add competencies_assessed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mock_interviews' AND column_name = 'competencies_assessed'
  ) THEN
    ALTER TABLE mock_interviews ADD COLUMN competencies_assessed text[];
  END IF;
END $$;