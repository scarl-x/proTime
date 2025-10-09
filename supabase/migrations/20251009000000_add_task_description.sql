-- Добавляем поле description для задач в календаре
DO $$
BEGIN
  -- Добавляем поле description если его еще нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_slots' AND column_name = 'description'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN description text;
  END IF;
END $$;

