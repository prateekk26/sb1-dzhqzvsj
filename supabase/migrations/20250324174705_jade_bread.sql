/*
  # Enhance experiences table with additional fields

  1. Changes
    - Add `description` text field to the `experiences` table for storing job descriptions
    - Add `source` text field to identify the origin of the experience (manual, linkedin, etc.)
    - Add `source_id` text field to store an identifier for externally imported experiences

  2. Rationale
    - Description field allows storing rich text about each experience
    - Source and source_id fields enable tracking external data sources
    - These changes support improved experience management and data integration
*/

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiences' AND column_name = 'description'
  ) THEN
    ALTER TABLE experiences ADD COLUMN description text;
  END IF;
END $$;

-- Add source column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiences' AND column_name = 'source'
  ) THEN
    ALTER TABLE experiences ADD COLUMN source text DEFAULT 'manual';
  END IF;
END $$;

-- Add source_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiences' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE experiences ADD COLUMN source_id text;
  END IF;
END $$;