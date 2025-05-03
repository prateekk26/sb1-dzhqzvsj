/*
  # Add title column to projects table
  
  1. Changes
     - Add `title` text field to the `projects` table
     - This allows projects to have a descriptive title in addition to their content
     
  2. Implementation
     - Uses a DO block to check if the column exists before adding it
     - This makes the migration idempotent (can be run multiple times safely)
*/

-- Add title column to projects table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'title'
  ) THEN
    ALTER TABLE projects ADD COLUMN title text;
  END IF;
END $$;