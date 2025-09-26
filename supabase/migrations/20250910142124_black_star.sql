/*
  # Fix RLS policies for public access

  1. Changes
    - Update RLS policies to allow public access instead of requiring authentication
    - This allows the app to work with simple email/password auth instead of Supabase Auth

  2. Security Note
    - In production, you might want to add API key validation or other security measures
    - For now, we're allowing public access to make the app work
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can manage users" ON users;
DROP POLICY IF EXISTS "Users can read all projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can read all time slots" ON time_slots;
DROP POLICY IF EXISTS "Authenticated users can manage time slots" ON time_slots;

-- Create new policies that allow public access
-- Users table policies
CREATE POLICY "Public can read all users"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage users"
  ON users
  FOR ALL
  TO public
  USING (true);

-- Projects table policies
CREATE POLICY "Public can read all projects"
  ON projects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage projects"
  ON projects
  FOR ALL
  TO public
  USING (true);

-- Time slots table policies
CREATE POLICY "Public can read all time slots"
  ON time_slots
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage time slots"
  ON time_slots
  FOR ALL
  TO public
  USING (true);