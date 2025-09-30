-- Удаляем колонку timezone_offset, оставляем только timezone (IANA)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'timezone_offset'
  ) THEN
    ALTER TABLE users DROP COLUMN timezone_offset;
  END IF;
END $$;

COMMENT ON COLUMN users.timezone IS 'IANA Timezone identifier for the user (e.g., Europe/Moscow)';
