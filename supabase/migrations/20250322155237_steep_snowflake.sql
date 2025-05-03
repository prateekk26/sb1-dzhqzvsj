/*
  # Update Storage Policy for Resume Management
  
  1. Changes
     - Modify the storage policy to organize resumes in user-specific folders
     - Improve security by validating file ownership
     - Enable users to manage multiple resume files
  
  2. Storage Structure
     - Store resumes in a path pattern: 'resumes/[user_id]/[timestamp]_[filename]'
     - This allows for better organization and multiple uploads per user
*/

-- Allow users to list their own files in their folder
CREATE POLICY "Allow users to list their own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = CAST(auth.uid() AS TEXT)
);

-- Ensure the delete policy is updated to handle folder structure
DROP POLICY IF EXISTS "Allow users to delete their own resumes" ON storage.objects;
CREATE POLICY "Allow users to delete their own resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = CAST(auth.uid() AS TEXT)
);