/*
  # Create job-descriptions storage bucket
  
  1. New Storage Bucket
     - `job-descriptions` bucket for storing PDF job descriptions
     
  2. Security
     - Enable appropriate policies for the bucket
     - Allow authenticated users to add and manage their own job descriptions
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-descriptions', 'job-descriptions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folders
CREATE POLICY "Users can upload their own job descriptions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own job descriptions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view their own job descriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to list files in their own folder
CREATE POLICY "Users can list their own job descriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own job descriptions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-descriptions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);