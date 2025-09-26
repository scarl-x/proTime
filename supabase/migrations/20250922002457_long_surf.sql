/*
  # Add employment date to users table

  1. Changes to users table
    - Add `employment_date` (date) - дата трудоустройства
    - Add `termination_date` (date, optional) - дата увольнения

  2. Indexes
    - Index for employment date queries

  3. Security
    - RLS policies remain unchanged

  4. Default Data
    - Update existing demo users with employment dates
*/

-- Add employment_date column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'employment_date'
  ) THEN
    ALTER TABLE users ADD COLUMN employment_date date;
  END IF;
END $$;

-- Add termination_date column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'termination_date'
  ) THEN
    ALTER TABLE users ADD COLUMN termination_date date;
  END IF;
END $$;

-- Create indexes for employment date queries
CREATE INDEX IF NOT EXISTS idx_users_employment_date ON users(employment_date) WHERE employment_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_termination_date ON users(termination_date) WHERE termination_date IS NOT NULL;

-- Update existing demo users with employment dates
UPDATE users SET employment_date = '2024-01-15' WHERE email = 'admin@company.com' AND employment_date IS NULL;
UPDATE users SET employment_date = '2024-03-01' WHERE email = 'ivan@company.com' AND employment_date IS NULL;
UPDATE users SET employment_date = '2024-06-01' WHERE email = 'maria@company.com' AND employment_date IS NULL;

-- Add comments
COMMENT ON COLUMN users.employment_date IS 'Дата трудоустройства сотрудника';
COMMENT ON COLUMN users.termination_date IS 'Дата увольнения сотрудника (если уволен)';