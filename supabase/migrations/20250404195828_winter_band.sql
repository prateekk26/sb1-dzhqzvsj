/*
  # Create storage bucket for interview recordings
  
  1. New Storage Bucket
     - `interview-recordings` bucket for storing audio recordings from mock interviews
     
  2. Security
     - Enable appropriate policies for the bucket
     - Allow authenticated users to add and manage their own recordings
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-recordings', 'interview-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folders
CREATE POLICY "Users can upload their own recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'interview-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view their own recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'interview-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'interview-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);