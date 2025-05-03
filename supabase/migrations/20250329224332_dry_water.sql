/*
  # Add impact_statement column to projects table
  
  1. Changes
     - Add `impact_statement` text field to the `projects` table
     
  2. Rationale
     - This enables storing AI-generated impact statements for each project
     - Improves user experience by allowing one-click copy of resume bullet points
     - Supports the new resume improvement workflow
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