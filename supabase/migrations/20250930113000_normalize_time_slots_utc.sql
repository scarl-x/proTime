/*
  Normalize legacy time_slots stored as local UTC+3 to true UTC

  Assumptions:
  - Columns:
      time_slots.date (date)
      time_slots.start_time (text, 'HH:MI')
      time_slots.end_time   (text, 'HH:MI')
  - Legacy data was saved as LOCAL time in UTC+3. We convert it to UTC by subtracting 3 hours.

  If your legacy base offset differs, change 'UTC+3' below accordingly.
*/

BEGIN;

WITH calc AS (
  SELECT
    id,
    (((date::timestamp + (start_time)::time) AT TIME ZONE 'UTC+3') AT TIME ZONE 'UTC') AS utc_start,
    (((date::timestamp + (end_time)::time)   AT TIME ZONE 'UTC+3') AT TIME ZONE 'UTC') AS utc_end
  FROM time_slots
)
UPDATE time_slots t
SET
  date = calc.utc_start::date,
  start_time = (calc.utc_start::time),
  end_time = (calc.utc_end::time)
FROM calc
WHERE t.id = calc.id;

COMMIT;


