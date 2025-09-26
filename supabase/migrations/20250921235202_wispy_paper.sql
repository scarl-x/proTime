/*
  # Fix daily standup config table structure

  1. Problem
    - Column project_id does not exist in daily_standup_config table
    - Need to add column first, then configure constraints

  2. Solution
    - Add project_id column if it doesn't exist
    - Remove old single config constraint
    - Set up proper project-based structure
    - Create configs for all existing projects

  3. Changes
    - Add project_id column with foreign key
    - Update primary key structure
    - Clean up old data and create new project-based configs
*/

-- First, check if the table exists and add project_id column if needed
DO $$
BEGIN
  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_standup_config' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE daily_standup_config ADD COLUMN project_id uuid;
    
    -- Add foreign key constraint
    ALTER TABLE daily_standup_config 
    ADD CONSTRAINT fk_daily_standup_config_project 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Remove old constraints if they exist
ALTER TABLE daily_standup_config DROP CONSTRAINT IF EXISTS single_config_record;
ALTER TABLE daily_standup_config DROP CONSTRAINT IF EXISTS daily_standup_config_pkey;

-- Remove old id column if it exists and project_id is available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_standup_config' AND column_name = 'id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_standup_config' AND column_name = 'project_id'
  ) THEN
    -- Clear all existing data first
    DELETE FROM daily_standup_config;
    
    -- Drop the old id column
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

-- Update policies to work with new structure
DROP POLICY IF EXISTS "Public can read standup config" ON daily_standup_config;
DROP POLICY IF EXISTS "Public can manage standup config" ON daily_standup_config;

CREATE POLICY "Public can read standup config"
  ON daily_standup_config
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can manage standup config"
  ON daily_standup_config
  FOR ALL
  TO public
  USING (true);

-- Add comments
COMMENT ON COLUMN daily_standup_config.project_id IS 'ID проекта для которого настраиваются дейлики';
COMMENT ON TABLE daily_standup_config IS 'Конфигурация автоматических ежедневных дейликов по проектам';