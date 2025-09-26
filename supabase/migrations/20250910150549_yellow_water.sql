/*
  # Add recurring tasks functionality

  1. New Columns for time_slots table
    - `is_recurring` (boolean) - является ли задача повторяющейся
    - `recurrence_type` (text) - тип повторения: daily, weekly, monthly
    - `recurrence_interval` (integer) - интервал повторения (каждые N дней/недель)
    - `recurrence_end_date` (date) - дата окончания повторений
    - `recurrence_days` (text array) - дни недели для еженедельного повторения
    - `parent_recurring_id` (uuid) - ID родительской повторяющейся задачи
    - `recurrence_count` (integer) - максимальное количество повторений

  2. Indexes
    - Индекс для поиска повторяющихся задач
    - Индекс для поиска по родительской повторяющейся задаче

  3. Security
    - Политики RLS остаются без изменений
*/

-- Add new columns to time_slots table for recurring functionality
DO $$
BEGIN
  -- Add is_recurring column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN is_recurring boolean DEFAULT false;
  END IF;

  -- Add recurrence_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'recurrence_type'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN recurrence_type text CHECK (recurrence_type IN ('daily', 'weekly', 'monthly'));
  END IF;

  -- Add recurrence_interval column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'recurrence_interval'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN recurrence_interval integer DEFAULT 1;
  END IF;

  -- Add recurrence_end_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN recurrence_end_date date;
  END IF;

  -- Add recurrence_days column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'recurrence_days'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN recurrence_days text[];
  END IF;

  -- Add parent_recurring_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'parent_recurring_id'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN parent_recurring_id uuid;
  END IF;

  -- Add recurrence_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'recurrence_count'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN recurrence_count integer;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_slots_is_recurring 
  ON time_slots(is_recurring) 
  WHERE is_recurring = true;

CREATE INDEX IF NOT EXISTS idx_time_slots_parent_recurring_id 
  ON time_slots(parent_recurring_id) 
  WHERE parent_recurring_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_time_slots_recurrence_type 
  ON time_slots(recurrence_type) 
  WHERE recurrence_type IS NOT NULL;

-- Add comments to document the new functionality
COMMENT ON COLUMN time_slots.is_recurring IS 'Является ли задача повторяющейся';
COMMENT ON COLUMN time_slots.recurrence_type IS 'Тип повторения: daily, weekly, monthly';
COMMENT ON COLUMN time_slots.recurrence_interval IS 'Интервал повторения (каждые N дней/недель/месяцев)';
COMMENT ON COLUMN time_slots.recurrence_end_date IS 'Дата окончания повторений';
COMMENT ON COLUMN time_slots.recurrence_days IS 'Дни недели для еженедельного повторения (0=Вс, 1=Пн, ..., 6=Сб)';
COMMENT ON COLUMN time_slots.parent_recurring_id IS 'ID родительской повторяющейся задачи';
COMMENT ON COLUMN time_slots.recurrence_count IS 'Максимальное количество повторений';