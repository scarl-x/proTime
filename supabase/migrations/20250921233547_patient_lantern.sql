/*
  # Create daily standup configuration table

  1. New Tables
    - `daily_standup_config`
      - `id` (integer, primary key) - фиксированный ID = 1
      - `start_time` (time) - время начала дейлика
      - `end_time` (time) - время окончания дейлика
      - `task` (text) - название задачи дейлика
      - `category` (text) - категория дейлика
      - `work_days` (integer array) - рабочие дни недели
      - `is_enabled` (boolean) - включены ли автоматические дейлики
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `daily_standup_config` table
    - Add policies for public access

  3. Default Configuration
    - Insert default configuration record
*/

CREATE TABLE IF NOT EXISTS daily_standup_config (
  id integer PRIMARY KEY DEFAULT 1,
  start_time time NOT NULL DEFAULT '11:30',
  end_time time NOT NULL DEFAULT '12:30',
  task text NOT NULL DEFAULT 'Ежедневный дейлик команды',
  category text NOT NULL DEFAULT 'Совещание',
  work_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_standup_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
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

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_standup_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_standup_config_updated_at 
  BEFORE UPDATE ON daily_standup_config 
  FOR EACH ROW 
  EXECUTE FUNCTION update_standup_config_updated_at();

-- Insert default configuration
INSERT INTO daily_standup_config (id, start_time, end_time, task, category, work_days, is_enabled) 
VALUES (1, '11:30', '12:30', 'Ежедневный дейлик команды', 'Совещание', '{1,2,3,4,5}', true)
ON CONFLICT (id) DO NOTHING;

-- Add constraint to ensure only one config record
ALTER TABLE daily_standup_config ADD CONSTRAINT single_config_record CHECK (id = 1);

-- Add comments
COMMENT ON TABLE daily_standup_config IS 'Конфигурация автоматических ежедневных дейликов';
COMMENT ON COLUMN daily_standup_config.work_days IS 'Рабочие дни недели: 1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб, 0=Вс';
COMMENT ON COLUMN daily_standup_config.is_enabled IS 'Включены ли автоматические дейлики';