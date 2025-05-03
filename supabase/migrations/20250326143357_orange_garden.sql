/*
  # Add AI enhancement fields to projects table
  
  1. Changes
     - Add `enhanced_description` text field to store AI-enhanced STAR format description
     - Add `competencies` text[] array field to store detected competency codes
     - Add `suggestions` text[] array field to store improvement suggestions
     
  2. Rationale
     - These fields support the AI enhancement feature for project descriptions
     - Storing competencies as an array allows efficient tracking of multiple competencies
     - Storing suggestions separately enables future UI features for tracking improvements
*/

-- Add enhanced_description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'enhanced_description'
  ) THEN
    ALTER TABLE projects ADD COLUMN enhanced_description text;
  END IF;
END $$;

-- Add competencies array column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'competencies'
  ) THEN
    ALTER TABLE projects ADD COLUMN competencies text[];
  END IF;
END $$;

-- Add suggestions array column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'suggestions'
  ) THEN
    ALTER TABLE projects ADD COLUMN suggestions text[];
  END IF;
END $$;