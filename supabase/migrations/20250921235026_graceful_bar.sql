/*
  # Fix NULL project_id values in daily_standup_config

  1. Problem
    - Existing records in daily_standup_config have NULL project_id values
    - This causes constraint violation when adding NOT NULL constraint

  2. Solution
    - Delete existing records with NULL project_id
    - Create new records for all existing projects
    - Ensure proper structure for project-based configs

  3. Changes
    - Clean up existing data
    - Recreate configs for all projects
    - Set proper defaults
*/

-- First, delete any existing records with NULL project_id
DELETE FROM daily_standup_config WHERE project_id IS NULL;

-- Make sure project_id column exists and is properly configured
DO $$
BEGIN
  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_standup_config' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE daily_standup_config ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop old primary key if it exists
ALTER TABLE daily_standup_config DROP CONSTRAINT IF EXISTS daily_standup_config_pkey;

-- Remove old id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_standup_config' AND column_name = 'id'
  ) THEN
    ALTER TABLE daily_standup_config DROP COLUMN id;
  END IF;
END $$;

-- Set project_id as NOT NULL and primary key
ALTER TABLE daily_standup_config ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE daily_standup_config ADD CONSTRAINT daily_standup_config_pkey PRIMARY KEY (project_id);

-- Create index for project lookups
CREATE INDEX IF NOT EXISTS idx_daily_standup_config_project_id ON daily_standup_config(project_id);

-- Insert default configurations for all existing projects
INSERT INTO daily_standup_config (project_id, start_time, end_time, task, category, work_days, is_enabled)
SELECT 
  p.id,
  '11:30'::time,
  '12:30'::time,
  'Ежедневный дейлик команды',
  'Совещание',
  '{1,2,3,4,5}'::integer[],
  false -- По умолчанию отключено для всех проектов
FROM projects p
ON CONFLICT (project_id) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  task = EXCLUDED.task,
  category = EXCLUDED.category,
  work_days = EXCLUDED.work_days,
  is_enabled = EXCLUDED.is_enabled;

-- Add comments
COMMENT ON COLUMN daily_standup_config.project_id IS 'ID проекта для которого настраиваются дейлики';
COMMENT ON TABLE daily_standup_config IS 'Конфигурация автоматических ежедневных дейликов по проектам';