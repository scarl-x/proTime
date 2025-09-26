/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `color` (text)
      - `status` (text)
      - `team_members` (text array)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  color text NOT NULL DEFAULT '#3B82F6',
  status text NOT NULL CHECK (status IN ('active', 'completed', 'on-hold')) DEFAULT 'active',
  team_members text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all projects
CREATE POLICY "Users can read all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to manage projects
CREATE POLICY "Authenticated users can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default projects
INSERT INTO projects (name, description, color, status, team_members) VALUES
  ('Веб-приложение CRM', 'Разработка системы управления клиентами', '#3B82F6', 'active', '{}'),
  ('Мобильное приложение', 'iOS и Android приложение для клиентов', '#10B981', 'active', '{}'),
  ('Система аналитики', 'Внутренняя система для анализа данных', '#F59E0B', 'on-hold', '{}')
ON CONFLICT DO NOTHING;