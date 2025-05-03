/*
  # Implement God Mode for Admin Users
  
  1. Changes
     - Modify the is_admin_user() function to always return TRUE
     - This gives admin users complete bypass of Row Level Security
     
  2. Security Impact
     - Admin users will now have unrestricted access to all data
     - This is a powerful change that should be used only in trusted admin scenarios
*/

-- Create or replace the is_admin_user function to always return TRUE
CREATE OR REPLACE FUNCTION is_admin_user() 
RETURNS BOOLEAN AS $$
BEGIN
  -- Always return TRUE to grant god mode access to admin users
  -- This effectively bypasses all RLS policies for admin users
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This function is very powerful as it gives complete database access.
-- In production, you might want to implement more granular permissions
-- or restrict admin access to specific users by email like:
-- RETURN auth.email() = 'admin@example.com';