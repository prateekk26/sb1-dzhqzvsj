/*
  # Create companies table for dropdown selection
  
  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on the table
    - Add policies for authenticated users to read all companies
    - Add policies for admin users to manage companies
    
  3. Functions
    - Create function to get all companies
    - Create function to add a new company
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create policies for companies
-- Allow all authenticated users to read companies
CREATE POLICY "Allow authenticated users to read companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to read companies
CREATE POLICY "Allow anonymous users to read companies"
  ON companies
  FOR SELECT
  TO anon
  USING (true);

-- Allow admin users to manage companies
CREATE POLICY "Allow admin users to manage companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Create function to get all companies
CREATE OR REPLACE FUNCTION get_all_companies()
RETURNS SETOF companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM companies
  ORDER BY name ASC;
END;
$$;

-- Create function to add a new company
CREATE OR REPLACE FUNCTION add_company(company_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Check if company already exists
  IF EXISTS (SELECT 1 FROM companies WHERE name = company_name) THEN
    SELECT id INTO new_id FROM companies WHERE name = company_name;
    RETURN new_id;
  END IF;

  -- Insert new company
  INSERT INTO companies (name)
  VALUES (company_name)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Insert some sample companies
INSERT INTO companies (name) VALUES
  ('Google'),
  ('Microsoft'),
  ('Amazon'),
  ('Apple'),
  ('Meta'),
  ('Netflix'),
  ('Uber'),
  ('Airbnb'),
  ('Twitter'),
  ('LinkedIn')
ON CONFLICT (name) DO NOTHING;