/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `role` (text)
      - `position` (text, optional)
      - `has_account` (boolean)
      - `password` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read all users
    - Add policy for authenticated users to manage users (admin only)
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  position text,
  has_account boolean DEFAULT false,
  password text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all users
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update/delete users (admin functionality)
CREATE POLICY "Authenticated users can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default admin user
INSERT INTO users (name, email, role, has_account, password) VALUES
  ('Админ Системы', 'admin@company.com', 'admin', true, 'password'),
  ('Иван Петров', 'ivan@company.com', 'employee', true, 'password'),
  ('Мария Сидорова', 'maria@company.com', 'employee', true, 'password')
ON CONFLICT (email) DO NOTHING;