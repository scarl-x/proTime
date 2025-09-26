/*
  # Create time_slots table

  1. New Tables
    - `time_slots`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to users)
      - `project_id` (uuid, foreign key to projects)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `task` (text)
      - `planned_hours` (numeric)
      - `actual_hours` (numeric)
      - `status` (text)
      - `category` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `time_slots` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  task text NOT NULL,
  planned_hours numeric(4,2) NOT NULL DEFAULT 0,
  actual_hours numeric(4,2) NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('planned', 'in-progress', 'completed')) DEFAULT 'planned',
  category text NOT NULL DEFAULT 'Development',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all time slots
CREATE POLICY "Users can read all time slots"
  ON time_slots
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to manage time slots
CREATE POLICY "Authenticated users can manage time slots"
  ON time_slots
  FOR ALL
  TO authenticated
  USING (true);