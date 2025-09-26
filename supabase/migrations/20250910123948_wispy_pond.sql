/*
  # Add task splitting and pause functionality

  1. New Columns
    - `parent_task_id` (uuid, optional) - ID родительской задачи для разбитых задач
    - `task_sequence` (integer, optional) - Порядковый номер части задачи
    - `total_task_hours` (numeric, optional) - Общее количество часов всей задачи
    - `is_paused` (boolean) - Приостановлена ли задача
    - `paused_at` (timestamptz, optional) - Когда была приостановлена
    - `resumed_at` (timestamptz, optional) - Когда была возобновлена

  2. Indexes
    - Индекс для поиска по parent_task_id
    - Индекс для поиска приостановленных задач

  3. Security
    - Политики RLS остаются без изменений
*/

-- Add new columns to time_slots table
DO $$
BEGIN
  -- Add parent_task_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'parent_task_id'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN parent_task_id uuid;
  END IF;

  -- Add task_sequence column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'task_sequence'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN task_sequence integer;
  END IF;

  -- Add total_task_hours column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'total_task_hours'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN total_task_hours numeric(4,2);
  END IF;

  -- Add is_paused column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'is_paused'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN is_paused boolean DEFAULT false;
  END IF;

  -- Add paused_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'paused_at'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN paused_at timestamptz;
  END IF;

  -- Add resumed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'resumed_at'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN resumed_at timestamptz;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_slots_parent_task_id 
  ON time_slots(parent_task_id) 
  WHERE parent_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_time_slots_is_paused 
  ON time_slots(is_paused) 
  WHERE is_paused = true;

CREATE INDEX IF NOT EXISTS idx_time_slots_task_sequence 
  ON time_slots(parent_task_id, task_sequence) 
  WHERE parent_task_id IS NOT NULL;

-- Add comment to document the new functionality
COMMENT ON COLUMN time_slots.parent_task_id IS 'ID родительской задачи для разбитых на части задач';
COMMENT ON COLUMN time_slots.task_sequence IS 'Порядковый номер части задачи (1, 2, 3...)';
COMMENT ON COLUMN time_slots.total_task_hours IS 'Общее количество часов всей задачи до разбиения';
COMMENT ON COLUMN time_slots.is_paused IS 'Приостановлена ли задача';
COMMENT ON COLUMN time_slots.paused_at IS 'Время приостановки задачи';
COMMENT ON COLUMN time_slots.resumed_at IS 'Время возобновления задачи';