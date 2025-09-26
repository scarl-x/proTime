/*
  # Create task categories table

  1. New Tables
    - `task_categories`
      - `id` (uuid, primary key)
      - `name` (text) - название категории
      - `description` (text) - описание категории
      - `default_hours` (numeric) - часы по умолчанию
      - `default_hourly_rate` (numeric) - ставка по умолчанию
      - `color` (text) - цвет категории
      - `is_active` (boolean) - активна ли категория
      - `created_by` (uuid) - кто создал
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `task_categories` table
    - Add policies for public access

  3. Indexes
    - Index for active categories
    - Index for created_by
*/

CREATE TABLE IF NOT EXISTS task_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  default_hours numeric(6,2) NOT NULL DEFAULT 8,
  default_hourly_rate numeric(8,2) NOT NULL DEFAULT 3500,
  color text NOT NULL DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can read all task categories"
  ON task_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage task categories"
  ON task_categories
  FOR ALL
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_categories_active ON task_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_task_categories_created_by ON task_categories(created_by);

-- Add category_id to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN category_id uuid REFERENCES task_categories(id);
  END IF;
END $$;

-- Create index for task categories
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);

-- Insert default categories
INSERT INTO task_categories (name, description, default_hours, default_hourly_rate, color, created_by) 
SELECT 
  'Разработка API', 
  'Создание и разработка API endpoints', 
  16, 
  3500, 
  '#3B82F6',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO task_categories (name, description, default_hours, default_hourly_rate, color, created_by) 
SELECT 
  'Тестирование', 
  'Написание и выполнение тестов', 
  8, 
  3000, 
  '#10B981',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO task_categories (name, description, default_hours, default_hourly_rate, color, created_by) 
SELECT 
  'Код-ревью', 
  'Проверка и ревью кода коллег', 
  4, 
  3500, 
  '#8B5CF6',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO task_categories (name, description, default_hours, default_hourly_rate, color, created_by) 
SELECT 
  'Документация', 
  'Написание технической документации', 
  6, 
  2500, 
  '#F59E0B',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO task_categories (name, description, default_hours, default_hourly_rate, color, created_by) 
SELECT 
  'Исправление багов', 
  'Поиск и исправление ошибок', 
  4, 
  3500, 
  '#EF4444',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM users WHERE role = 'admin')
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE task_categories IS 'Категории задач для быстрого создания типовых задач';
COMMENT ON COLUMN task_categories.default_hours IS 'Часы по умолчанию для задач этой категории';
COMMENT ON COLUMN task_categories.default_hourly_rate IS 'Ставка по умолчанию для задач этой категории';
COMMENT ON COLUMN task_categories.color IS 'Цвет категории для визуального отличия';