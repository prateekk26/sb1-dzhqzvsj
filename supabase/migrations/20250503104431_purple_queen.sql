/*
  # Add location column to interview_reviews table
  
  1. Changes
     - Add `location` text field to store the user's location when submitting a review
     
  2. Rationale
     - This enables location-based analysis of interview experiences
     - Helps users find relevant interview experiences in their area
     - Supports future features like location-based filtering
*/

-- Add location column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_reviews' AND column_name = 'location'
  ) THEN
    ALTER TABLE interview_reviews ADD COLUMN location text;
  END IF;
END $$;