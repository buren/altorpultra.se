-- Track when a runner checked in at the venue. NULL = not yet checked in.
ALTER TABLE runners ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
