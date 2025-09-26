/*
  # Add birthday field to users table

  1. Changes
    - Add `birthday` (date, optional) column to users table
    - Update demo users with sample birthdays

  2. Indexes
    - Add index for birthday queries

  3. Security
    - RLS policies remain unchanged
*/

-- Add birthday column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'birthday'
  ) THEN
    ALTER TABLE users ADD COLUMN birthday date;
  END IF;
END $$;

-- Create index for birthday queries
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday) WHERE birthday IS NOT NULL;

-- Update existing demo users with sample birthdays
UPDATE users SET birthday = '1990-03-15' WHERE email = 'admin@company.com';
UPDATE users SET birthday = '1988-07-22' WHERE email = 'ivan@company.com';
UPDATE users SET birthday = '1992-11-08' WHERE email = 'maria@company.com';

-- Add comment
COMMENT ON COLUMN users.birthday IS 'Дата рождения сотрудника';