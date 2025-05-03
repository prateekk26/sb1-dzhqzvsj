/*
  # Add date_range field to interview_reviews table
  
  1. Changes
     - Add `date_range` text field to store when the interview occurred
     
  2. Rationale
     - This allows users to specify how recent their interview experience was
     - Helps other users gauge the relevance and recency of the feedback
     - Supports filtering by timeframe in the future
*/

-- Add date_range column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_reviews' AND column_name = 'date_range'
  ) THEN
    ALTER TABLE interview_reviews ADD COLUMN date_range text;
  END IF;
END $$;