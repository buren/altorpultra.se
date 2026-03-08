-- Add kids race started timestamp to editions
ALTER TABLE editions ADD COLUMN IF NOT EXISTS kids_race_started_at timestamptz;
