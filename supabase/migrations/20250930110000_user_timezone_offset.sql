/*
  # Add timezone_offset to users

  - Adds optional integer `timezone_offset` (minutes offset from UTC)
  - Example: Moscow UTC+3 => 180, India UTC+5:30 => 330
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'timezone_offset'
  ) THEN
    ALTER TABLE users ADD COLUMN timezone_offset integer;
    COMMENT ON COLUMN users.timezone_offset IS 'Смещение часового пояса пользователя в минутах относительно UTC';
  END IF;
END $$;


