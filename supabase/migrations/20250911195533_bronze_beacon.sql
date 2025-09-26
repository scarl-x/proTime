/*
  # Create tasks table for project task management

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `name` (text) - название задачи
      - `description` (text) - описание задачи
      - `planned_hours` (numeric) - плановые часы из договора
      - `actual_hours` (numeric) - фактические часы (вычисляется)
      - `hourly_rate` (numeric) - ставка за час (по умолчанию 3500)
      - `total_cost` (numeric) - общая стоимость (плановые часы * ставка)
      - `status` (text) - статус задачи
      - `created_by` (uuid) - кто создал задачу
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Task Assignments Table
    - `task_assignments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `employee_id` (uuid, foreign key to users)
      - `allocated_hours` (numeric) - выделенные часы сотруднику
      - `actual_hours` (numeric) - фактически потрачено
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on both tables
    - Add policies for public access

  4. Indexes
    - Index for project_id
    - Index for task assignments
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  planned_hours numeric(6,2) NOT NULL DEFAULT 0,
  actual_hours numeric(6,2) NOT NULL DEFAULT 0,
  hourly_rate numeric(8,2) NOT NULL DEFAULT 3500,
  total_cost numeric(10,2) GENERATED ALWAYS AS (planned_hours * hourly_rate) STORED,
  status text NOT NULL CHECK (status IN ('planning', 'in-progress', 'completed', 'on-hold')) DEFAULT 'planning',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allocated_hours numeric(6,2) NOT NULL DEFAULT 0,
  actual_hours numeric(6,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, employee_id)
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can read all tasks"
  ON tasks
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage tasks"
  ON tasks
  FOR ALL
  TO public
  USING (true);

CREATE POLICY "Public can read all task assignments"
  ON task_assignments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage task assignments"
  ON task_assignments
  FOR ALL
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_employee_id ON task_assignments(employee_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_tasks_updated_at();

-- Function to update actual hours in tasks based on assignments
CREATE OR REPLACE FUNCTION update_task_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tasks 
    SET actual_hours = (
        SELECT COALESCE(SUM(actual_hours), 0) 
        FROM task_assignments 
        WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
    )
    WHERE id = COALESCE(NEW.task_id, OLD.task_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_actual_hours_trigger
    AFTER INSERT OR UPDATE OR DELETE ON task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_actual_hours();

-- Add comments
COMMENT ON TABLE tasks IS 'Задачи проектов с планом часов из договора';
COMMENT ON TABLE task_assignments IS 'Распределение задач по сотрудникам';
COMMENT ON COLUMN tasks.planned_hours IS 'Плановые часы из договора';
COMMENT ON COLUMN tasks.actual_hours IS 'Фактические часы (автоматически вычисляется)';
COMMENT ON COLUMN tasks.hourly_rate IS 'Ставка за час в рублях';
COMMENT ON COLUMN tasks.total_cost IS 'Общая стоимость (плановые часы * ставка)';
COMMENT ON COLUMN task_assignments.allocated_hours IS 'Выделенные часы сотруднику';
COMMENT ON COLUMN task_assignments.actual_hours IS 'Фактически потрачено сотрудником';