/*
  # Add competency_rationales field to projects table
  
  1. Changes
     - Add `competency_rationales` jsonb field to store rationale for each competency
     
  2. Rationale
     - This allows storing AI-generated explanations for why each competency was identified
     - Improves transparency and understanding of competency assignments
     - Enables better user experience by showing the reasoning behind competency selection
*/

-- Add competency_rationales column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'competency_rationales'
  ) THEN
    ALTER TABLE projects ADD COLUMN competency_rationales jsonb;
  END IF;
END $$;