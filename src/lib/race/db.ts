import { SupabaseClient } from "@supabase/supabase-js";
import { Runner, Lap } from "./types";
import { getNextLapNumber } from "./services";

export async function addRunner(
  supabase: SupabaseClient,
  runner: Omit<Runner, "id">
): Promise<Runner> {
  const { data, error } = await supabase
    .from("runners")
    .insert(runner)
    .select()
    .single();

  if (error) throw error;
  return data as Runner;
}

export async function updateRunner(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<Runner, "name" | "bib" | "gender" | "notes">>
): Promise<Runner> {
  const { data, error } = await supabase
    .from("runners")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Runner;
}

export async function deleteRunner(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("runners").delete().eq("id", id);
  if (error) throw error;
}

export async function getRunners(
  supabase: SupabaseClient,
  editionYear: number
): Promise<Runner[]> {
  const { data, error } = await supabase
    .from("runners")
    .select("*")
    .eq("edition_year", editionYear)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Runner[];
}

export async function registerLap(
  supabase: SupabaseClient,
  bib: number,
  editionYear: number
): Promise<{ lap: Lap; runner: Runner }> {
  const { data: runner, error: runnerErr } = await supabase
    .from("runners")
    .select("*")
    .eq("bib", bib)
    .eq("edition_year", editionYear)
    .single();

  if (runnerErr || !runner) {
    throw new Error(`No runner found with bib ${bib}`);
  }

  const { data: existingLaps } = await supabase
    .from("laps")
    .select("*")
    .eq("runner_id", runner.id);

  const nextLapNumber = getNextLapNumber((existingLaps as Lap[]) ?? []);

  const { data: lap, error: lapErr } = await supabase
    .from("laps")
    .insert({
      runner_id: runner.id,
      lap_number: nextLapNumber,
    })
    .select()
    .single();

  if (lapErr) throw lapErr;
  return { lap: lap as Lap, runner: runner as Runner };
}

export async function deleteLap(
  supabase: SupabaseClient,
  lapId: string
): Promise<void> {
  const { error } = await supabase.from("laps").delete().eq("id", lapId);
  if (error) throw error;
}

export async function getLaps(
  supabase: SupabaseClient,
  editionYear: number
): Promise<Lap[]> {
  const { data, error } = await supabase
    .from("laps")
    .select("*, runners!inner(edition_year)")
    .eq("runners.edition_year", editionYear)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data as Lap[];
}

export async function getRecentLaps(
  supabase: SupabaseClient,
  editionYear: number,
  limit: number = 10
): Promise<(Lap & { runner_name: string; runner_bib: number })[]> {
  const { data, error } = await supabase
    .from("laps")
    .select("*, runners!inner(name, bib, edition_year)")
    .eq("runners.edition_year", editionYear)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    runner_id: row.runner_id,
    timestamp: row.timestamp,
    lap_number: row.lap_number,
    runner_name: row.runners.name,
    runner_bib: row.runners.bib,
  }));
}
