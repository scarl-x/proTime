/* Add IANA timezone column to users */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE users ADD COLUMN timezone text;
    COMMENT ON COLUMN users.timezone IS 'IANA timezone id, e.g., Europe/Moscow, Asia/Yekaterinburg';
  END IF;
END $$;


