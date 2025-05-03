/*
  # Create storage bucket for resume files

  1. New Storage Bucket
    - `resumes` bucket for storing user resume files
  
  2. Security
    - Enable RLS
    - Add policy for authenticated users to upload their own files
    - Add policy for authenticated users to read their own files
*/

-- Create a storage bucket for resume uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
UPDATE storage.buckets 
SET public = false 
WHERE id = 'resumes';

-- Create policies for the resumes bucket
-- Policy to allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own resumes" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Users can update their own resumes" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy to allow authenticated users to read their own files
CREATE POLICY "Users can read their own resumes" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own resumes" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);