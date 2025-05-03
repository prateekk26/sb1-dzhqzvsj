/*
  # Add competency_rationales column to projects table
  
  1. Changes
     - Add `competency_rationales` jsonb field to store rationales for each competency
     
  2. Rationale
     - This enables storing detailed explanations for why each competency was identified
     - Improves user experience by providing context for competency selections
     - Supports the enhanced AI feature that provides rationales
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