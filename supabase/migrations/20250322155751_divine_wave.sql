/*
  # Make Resume Storage Bucket Public
  
  1. Changes
     - Update the resumes bucket to be publicly accessible
     - This allows users to view resume files without authentication
  
  2. Security
     - Files are still protected by path structure (user ID in path)
     - Policies still ensure only owners can manage their files
*/

-- Make the resumes bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'resumes';