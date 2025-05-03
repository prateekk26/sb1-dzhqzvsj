/*
  # Add impact_statement field to projects table
  
  1. Changes
     - Add `impact_statement` text field to store generated resume impact statements
     
  2. Rationale
     - Allows storing AI-generated impact statements for projects
     - Enables quick access to resume-ready bullet points without re-generation
*/

-- Add impact_statement column to projects table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'impact_statement'
  ) THEN
    ALTER TABLE projects ADD COLUMN impact_statement text;
  END IF;
END $$;