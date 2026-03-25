-- Enable Row Level Security on all public tables.
-- All writes go through the service role key (which bypasses RLS),
-- so we only need public read policies for the anon key (used by Realtime).

ALTER TABLE public.laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.laps
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON public.runners
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON public.editions
  FOR SELECT USING (true);
