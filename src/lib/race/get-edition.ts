import { resolveCurrentEditionFromDb } from "@/lib/race/db";
import { getPublishedEditions } from "@/lib/race/db";
import { createServerClient } from "@/lib/race/supabase-server";
import { Edition } from "@/lib/race/editions";

/**
 * Server-side helper to get the current edition.
 * Use this in server components and generateMetadata.
 */
export async function getCurrentEdition(): Promise<Edition | null> {
  const supabase = createServerClient();
  return resolveCurrentEditionFromDb(supabase);
}

/**
 * Server-side helper to get all published edition years.
 */
export async function getPublishedYears(): Promise<number[]> {
  const supabase = createServerClient();
  const editions = await getPublishedEditions(supabase);
  return editions.map((e) => e.year).sort((a, b) => b - a);
}
