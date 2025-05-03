/*
  # Add role and suspended columns to users_profile table
  
  1. Changes
     - Add `role` text field with default value 'user'
     - Add `suspended` boolean field with default value false
     
  2. Rationale
     - The `role` column enables role-based access control (user, recruiter, admin)
     - The `suspended` column allows for account suspension functionality
     - These changes support the auth context's user management features
*/

-- Add role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'role'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Add suspended column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'suspended'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN suspended boolean DEFAULT false;
  END IF;
END $$;

-- Add comment to explain the role column
COMMENT ON COLUMN users_profile.role IS 'User role: user, recruiter, or admin';

-- Add comment to explain the suspended column
COMMENT ON COLUMN users_profile.suspended IS 'Whether the user account is suspended';