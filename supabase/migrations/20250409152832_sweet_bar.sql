/*
  # Fix RLS Policy for Interviews Table
  
  1. Changes
     - Update the RLS policy for the interviews table to use a subquery for auth.uid()
     - This improves query performance by evaluating the function once per query instead of once per row
     
  2. Rationale
     - The current implementation calls auth.uid() directly, which is evaluated for each row
     - Using (SELECT auth.uid()) ensures the function is evaluated only once per query
     - This is a performance optimization recommended for Supabase RLS policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can update their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can delete their own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can insert their own interviews" ON interviews;

-- Recreate policies with optimized subquery pattern
CREATE POLICY "Users can view their own interviews"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own interviews"
  ON interviews
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own interviews"
  ON interviews
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own interviews"
  ON interviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));