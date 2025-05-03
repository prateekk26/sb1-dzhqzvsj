/*
  # Add Admin Function for Questions Management
  
  1. Changes
    - Create a function to check if a user is an admin
    - Update RLS policies to restrict question management to admins

  2. Access Control
    - Only admins can insert, update, and delete questions
    - All authenticated users can view questions
*/

-- Create or replace admin check function
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS boolean AS $$
BEGIN
  RETURN auth.email() = 'prateekkurkanji@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert questions" ON interview_questions;
DROP POLICY IF EXISTS "Authenticated users can update questions" ON interview_questions;
DROP POLICY IF EXISTS "Authenticated users can delete questions" ON interview_questions;

-- Create restrictive policies for admin-only operations
CREATE POLICY "Admin can insert questions"
  ON interview_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admin can update questions" 
  ON interview_questions
  FOR UPDATE
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admin can delete questions"
  ON interview_questions
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Leave the read policy in place for all users
-- This was already created in a previous migration:
-- "Authenticated users can view all questions"