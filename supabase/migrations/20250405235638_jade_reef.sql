/*
  # Add features for interview recording analysis
  
  1. Changes
    - Add `recording_url` text field to store link to uploaded recording
    - Add `transcript` text field to store interview transcript
    - Add `analysis_results` jsonb field to store AI analysis data
    - Add `analyzed_at` timestamptz field to track when analysis occurred
    
  2. Rationale
    - These changes support the new feature for users to upload and analyze real interviews
    - Structured data storage for AI analysis results enables deeper insights
*/

-- Add recording_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'recording_url'
  ) THEN
    ALTER TABLE interviews ADD COLUMN recording_url text;
  END IF;
END $$;

-- Add transcript column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'transcript'
  ) THEN
    ALTER TABLE interviews ADD COLUMN transcript text;
  END IF;
END $$;

-- Add analysis_results column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'analysis_results'
  ) THEN
    ALTER TABLE interviews ADD COLUMN analysis_results jsonb;
  END IF;
END $$;

-- Add analyzed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interviews' AND column_name = 'analyzed_at'
  ) THEN
    ALTER TABLE interviews ADD COLUMN analyzed_at timestamptz;
  END IF;
END $$;