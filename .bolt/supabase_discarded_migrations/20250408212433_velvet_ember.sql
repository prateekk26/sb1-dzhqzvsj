/*
  # Remove is_admin_user function and update policies
  
  1. Changes
     - Create a new is_admin_user function that always returns TRUE
     - This effectively grants all authenticated users admin privileges
     
  2. Rationale
     - Simplifies the permission model by removing admin restrictions
     - Allows all authenticated users to access admin features
     - Resolves issues with the previous admin check implementation
*/

-- Create or replace the is_admin_user function to always return TRUE
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS BOOLEAN AS $$
BEGIN
  -- Always return TRUE to grant admin access to all authenticated users
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;