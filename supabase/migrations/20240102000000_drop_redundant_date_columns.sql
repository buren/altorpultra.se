-- Drop columns that are now computed from date + start_time + end_time
ALTER TABLE editions DROP COLUMN IF EXISTS start_date_time;
ALTER TABLE editions DROP COLUMN IF EXISTS end_date_time;
ALTER TABLE editions DROP COLUMN IF EXISTS duration_hours;
ALTER TABLE editions DROP COLUMN IF EXISTS date_formatted;
