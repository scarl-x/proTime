/* Add UTC datetime columns to time_slots and backfill from date + start_time/end_time with zone UTC+0 (assumes current values already UTC) */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'start_at_utc'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN start_at_utc timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_slots' AND column_name = 'end_at_utc'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN end_at_utc timestamptz;
  END IF;
END $$;

-- Backfill assuming existing date+time is in UTC already
UPDATE time_slots
SET start_at_utc = (date::timestamp at time zone 'UTC') + (start_time),
    end_at_utc = (date::timestamp at time zone 'UTC') + (end_time)
WHERE start_at_utc IS NULL OR end_at_utc IS NULL;


