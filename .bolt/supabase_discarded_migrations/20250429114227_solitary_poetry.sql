/*
  # Add profile_completed column to users_profile table
  
  1. Changes
     - Add `profile_completed` boolean field with default value false
     
  2. Rationale
     - This enables tracking whether a user has completed their profile
     - Improves user management in the admin interface
     - Supports better onboarding flow tracking
*/

-- Add profile_completed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN profile_completed boolean DEFAULT false;
  END IF;
END $$;

-- Add comment to explain the profile_completed column
COMMENT ON COLUMN users_profile.profile_completed IS 'Whether the user has completed their profile setup';