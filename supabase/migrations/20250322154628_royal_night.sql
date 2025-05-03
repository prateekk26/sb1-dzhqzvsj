/*
  # Configure Storage for Resume Uploads

  1. New Storage Configuration
    - Create the 'resumes' storage bucket if it doesn't exist
    - Set public access policy to 'none'

  2. Security
    - Enable appropriate RLS policies for the 'resumes' bucket
    - Allow authenticated users to upload their own resumes
    - Allow authenticated users to read their own resumes
    - Allow authenticated users to update their own resumes
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Set policies for the resumes bucket
-- Allow authenticated users to upload files (insert)
CREATE POLICY "Allow authenticated users to upload resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

-- Allow users to read their own files
CREATE POLICY "Allow users to read their own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resumes' AND CAST(auth.uid() AS TEXT) = CAST(owner AS TEXT));

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own resumes"
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'resumes' AND CAST(auth.uid() AS TEXT) = CAST(owner AS TEXT));

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'resumes' AND CAST(auth.uid() AS TEXT) = CAST(owner AS TEXT));