-- Track when a runner stops mid-race. NULL = still running (or never started).
ALTER TABLE runners ADD COLUMN IF NOT EXISTS stopped_at timestamptz;
