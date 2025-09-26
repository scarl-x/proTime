/*
  # Create leave requests table for tracking vacations, sick leaves, and time off

  1. New Tables
    - `leave_requests`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to users)
      - `type` (text) - тип отпуска: vacation, sick_leave, personal_leave, compensatory_leave
      - `start_date` (date) - дата начала
      - `end_date` (date) - дата окончания
      - `days_count` (integer) - количество дней
      - `reason` (text) - причина/описание
      - `status` (text) - статус: pending, approved, rejected, cancelled
      - `approved_by` (uuid, optional) - кто одобрил
      - `approved_at` (timestamptz, optional) - когда одобрено
      - `notes` (text, optional) - заметки администратора
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leave_requests` table
    - Add policies for public access

  3. Indexes
    - Index for employee_id and date range
    - Index for status and type
*/

CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('vacation', 'sick_leave', 'personal_leave', 'compensatory_leave')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count integer NOT NULL,
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can read all leave requests"
  ON leave_requests
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage leave requests"
  ON leave_requests
  FOR ALL
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_dates 
  ON leave_requests(employee_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status 
  ON leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_type 
  ON leave_requests(type);

CREATE INDEX IF NOT EXISTS idx_leave_requests_date_range 
  ON leave_requests(start_date, end_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leave_requests_updated_at 
  BEFORE UPDATE ON leave_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_leave_requests_updated_at();

-- Add comments for documentation
COMMENT ON TABLE leave_requests IS 'Заявки на отпуска, больничные и отгулы';
COMMENT ON COLUMN leave_requests.type IS 'Тип отпуска: vacation, sick_leave, personal_leave, compensatory_leave';
COMMENT ON COLUMN leave_requests.status IS 'Статус заявки: pending, approved, rejected, cancelled';
COMMENT ON COLUMN leave_requests.days_count IS 'Количество календарных дней';