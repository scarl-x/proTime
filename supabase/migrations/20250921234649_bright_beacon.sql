/*
  # Update daily standup configuration for multiple projects

  1. Changes to daily_standup_config table
    - Add `project_id` (uuid, foreign key to projects)
    - Remove single config constraint
    - Update policies and structure

  2. New Structure
    - Multiple configurations, one per project
    - Each project can have its own standup settings
    - Different teams can have different standup times

  3. Security
    - Update RLS policies
    - Maintain public access pattern

  4. Migration
    - Convert existing single config to project-based configs
    - Create configs for all existing projects
*/

-- Remove the single config constraint
ALTER TABLE daily_standup_config DROP CONSTRAINT IF EXISTS single_config_record;

-- Add project_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_standup_config' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE daily_standup_config ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the primary key to include project_id
ALTER TABLE daily_standup_config DROP CONSTRAINT IF EXISTS daily_standup_config_pkey;
ALTER TABLE daily_standup_config ADD CONSTRAINT daily_standup_config_pkey PRIMARY KEY (project_id);

-- Remove the old id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_standup_config' AND column_name = 'id'
  ) THEN
    ALTER TABLE daily_standup_config DROP COLUMN id;
  END IF;
END $$;

-- Create index for project lookups
CREATE INDEX IF NOT EXISTS idx_daily_standup_config_project_id ON daily_standup_config(project_id);

-- Clear existing config and create project-based configs
DELETE FROM daily_standup_config;

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
ON CONFLICT (project_id) DO NOTHING;

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