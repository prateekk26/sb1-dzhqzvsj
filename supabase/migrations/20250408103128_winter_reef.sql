/*
  # Fix admin user function to properly check email
  
  1. Changes
     - Replace the is_admin_user() function with a fixed implementation
     - Ensure the function properly accesses the current user's email
     - Add explicit parameter handling to avoid RPC errors
     
  2. Rationale
     - The previous implementation was causing errors when called via RPC
     - This new implementation fixes the parameter handling and email checking
*/

-- Create or replace the is_admin_user function with proper parameter handling
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
DECLARE
  admin_emails text[] := ARRAY['prateekkurkanji@gmail.com'];
  current_email text;
BEGIN
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();

  IF current_email IS NOT NULL THEN
    RETURN current_email = ANY(admin_emails);
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;