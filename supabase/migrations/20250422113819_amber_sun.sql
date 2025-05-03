/*
  # Add location field to users_profile table
  
  1. Changes
     - Add `location` text field to store user's location information
     
  2. Rationale
     - This enables location-aware job matching and salary information
     - Improves personalization of job recommendations
     - Supports region-specific analysis and currency formatting
*/

-- Add location column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'location'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN location text;
  END IF;
END $$;