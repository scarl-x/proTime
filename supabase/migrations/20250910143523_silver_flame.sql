/*
  # Create bookings table for employee time reservations

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `requester_id` (uuid, foreign key to users) - кто бронирует
      - `employee_id` (uuid, foreign key to users) - чье время бронируется
      - `project_id` (uuid, foreign key to projects) - для какого проекта
      - `date` (date) - дата бронирования
      - `start_time` (time) - время начала
      - `end_time` (time) - время окончания
      - `duration_hours` (numeric) - продолжительность в часах
      - `task_description` (text) - описание задачи
      - `status` (text) - статус бронирования
      - `notes` (text, optional) - дополнительные заметки
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `bookings` table
    - Add policies for public access (matching existing pattern)

  3. Indexes
    - Index for employee_id and date for quick availability checks
    - Index for requester_id for user's bookings
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_hours numeric(4,2) NOT NULL,
  task_description text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Public can read all bookings"
  ON bookings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage bookings"
  ON bookings
  FOR ALL
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_employee_date 
  ON bookings(employee_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_requester 
  ON bookings(requester_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
  ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_project 
  ON bookings(project_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE bookings IS 'Бронирования времени сотрудников для совместной работы';
COMMENT ON COLUMN bookings.requester_id IS 'ID сотрудника, который делает бронирование';
COMMENT ON COLUMN bookings.employee_id IS 'ID сотрудника, чье время бронируется';
COMMENT ON COLUMN bookings.status IS 'Статус бронирования: pending, approved, rejected, completed, cancelled';
COMMENT ON COLUMN bookings.duration_hours IS 'Продолжительность бронирования в часах';