/*
  # Add company_linkedin_url column to interview_reviews table
  
  1. Changes
     - Add `company_linkedin_url` text field to store LinkedIn URL of the company
     
  2. Rationale
     - This allows storing the LinkedIn URL of the company for future reference
     - Enables better data quality and verification
     - Supports integration with LinkedIn API for company details
*/

-- Add company_linkedin_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_reviews' AND column_name = 'company_linkedin_url'
  ) THEN
    ALTER TABLE interview_reviews ADD COLUMN company_linkedin_url text;
  END IF;
END $$;