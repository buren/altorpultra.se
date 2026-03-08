import { SupabaseClient } from "@supabase/supabase-js";
import { Runner, Lap } from "./types";
import { getNextLapNumber } from "./services";
import { Edition, mapDbRowToEdition, mapEditionToDbRow } from "./editions";
import { DAYS_BEFORE_LEADERBOARD_SWITCH } from "@/lib/config";
import { resolveCurrentEdition } from "./editions";

// ── Edition queries ──

export async function getPublishedEditions(
  supabase: SupabaseClient
): Promise<Edition[]> {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .not("published_at", "is", null)
    .order("year", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapDbRowToEdition);
}

export async function getAllEditions(
  supabase: SupabaseClient
): Promise<Edition[]> {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .order("year", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapDbRowToEdition);
}

export async function getEdition(
  supabase: SupabaseClient,
  year: number
): Promise<Edition | null> {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .eq("year", year)
    .single();

  if (error) return null;
  return mapDbRowToEdition(data);
}

export async function createEdition(
  supabase: SupabaseClient,
  edition: Edition
): Promise<Edition> {
  const { data, error } = await supabase
    .from("editions")
    .insert(mapEditionToDbRow(edition))
    .select()
    .single();

  if (error) throw error;
  return mapDbRowToEdition(data);
}

export async function updateEdition(
  supabase: SupabaseClient,
  year: number,
  updates: Partial<Edition>
): Promise<Edition> {
  // Build partial DB row from the updates provided
  const full = { ...updates } as Edition;
  const row = mapEditionToDbRow(full);
  // Only include fields that were actually in updates
  const partialRow: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    // Map camelCase update keys to their snake_case DB equivalents
    if (key === "googleMaps") {
      if (updates.googleMaps) {
        if (updates.googleMaps.startPin !== undefined) partialRow.google_maps_start_pin = updates.googleMaps.startPin;
        if (updates.googleMaps.parkingPin !== undefined) partialRow.google_maps_parking_pin = updates.googleMaps.parkingPin;
        if (updates.googleMaps.routeEmbed !== undefined) partialRow.google_maps_route_embed = updates.googleMaps.routeEmbed;
        if (updates.googleMaps.routeViewer !== undefined) partialRow.google_maps_route_viewer = updates.googleMaps.routeViewer;
      }
    } else {
      // Find the corresponding snake_case key in the full row
      const snakeKey = Object.keys(row).find(
        (k) => k === camelToSnake(key)
      );
      if (snakeKey) partialRow[snakeKey] = (row as any)[snakeKey];
    }
  }

  const { data, error } = await supabase
    .from("editions")
    .update(partialRow)
    .eq("year", year)
    .select()
    .single();

  if (error) throw error;
  return mapDbRowToEdition(data);
}

export async function deleteEdition(
  supabase: SupabaseClient,
  year: number
): Promise<void> {
  const { error } = await supabase.from("editions").delete().eq("year", year);
  if (error) throw error;
}

export async function resolveCurrentEditionFromDb(
  supabase: SupabaseClient
): Promise<Edition | null> {
  const editions = await getPublishedEditions(supabase);
  return resolveCurrentEdition(editions, new Date(), DAYS_BEFORE_LEADERBOARD_SWITCH);
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

// ── Runner queries ──

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

export async function getAllLaps(
  supabase: SupabaseClient,
  editionYear: number
): Promise<Lap[]> {
  const { data, error } = await supabase
    .from("laps")
    .select("*, runners!inner(edition_year)")
    .eq("runners.edition_year", editionYear)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    runner_id: row.runner_id,
    timestamp: row.timestamp,
    lap_number: row.lap_number,
  }));
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
