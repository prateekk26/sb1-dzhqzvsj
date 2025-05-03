/*
  # Add email column to users_profile table

  1. Changes
    - Add `email` column to the `users_profile` table
    - Column is nullable to support existing rows
    - Email will be populated when creating new profiles
  
  2. Rationale
    - Storing email in the profile table provides easier access
    - Complements the auth.users table by having email directly in our application data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'email'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN email text;
  END IF;
END $$;