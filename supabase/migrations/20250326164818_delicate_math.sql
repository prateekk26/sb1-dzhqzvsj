/*
  # Add title field to projects table
  
  1. Changes
     - Add `title` text field to the `projects` table for storing project titles
     
  2. Rationale
     - This enables users to give their projects descriptive titles
     - Improves organization and makes projects more easily identifiable
     - Enhances the project management experience
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