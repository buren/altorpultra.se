import { validateAdminPassword } from "./admin-auth";
import { validateNewRunner, getNextBibNumber, validateTimestamp, renumberLaps } from "./services";
import * as db from "./db";
import { createServerClient } from "./supabase-server";
import { Gender } from "./types";

export type Result<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function requireAuth(
  inputPassword: string,
  serverPassword: string
): string | null {
  if (!validateAdminPassword(inputPassword, serverPassword)) {
    return "Unauthorized";
  }
  return null;
}

export async function handleAuth(
  inputPassword: string,
  serverPassword: string
): Promise<Result> {
  if (!validateAdminPassword(inputPassword, serverPassword)) {
    return { ok: false, error: "Invalid password" };
  }
  return { ok: true };
}

export async function handleRegisterLap(
  body: any,
  editionYear: number,
  inputPassword: string,
  serverPassword: string
): Promise<Result> {
  const authErr = requireAuth(inputPassword, serverPassword);
  if (authErr) return { ok: false, error: authErr };

  const bib = Number(body.bib);
  if (!body.bib && body.bib !== 0) return { ok: false, error: "Bib number is required" };
  if (!Number.isInteger(bib) || bib < 1)
    return { ok: false, error: "Bib number must be a positive integer" };

  try {
    const result = await db.registerLap(createServerClient(), bib, editionYear);
    return { ok: true, data: result };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function handleAddRunner(
  body: any,
  editionYear: number,
  inputPassword: string,
  serverPassword: string
): Promise<Result> {
  const authErr = requireAuth(inputPassword, serverPassword);
  if (authErr) return { ok: false, error: authErr };

  const { name, bib, gender, notes } = body;
  const hasBib = bib !== undefined && bib !== null && bib !== "";
  const bibNum = hasBib ? Number(bib) : null;
  const validationErr = validateNewRunner(name ?? "", bibNum, gender ?? "");
  if (validationErr) return { ok: false, error: validationErr };

  try {
    const existing = await db.getRunners(createServerClient(), editionYear);
    const finalBib = bibNum ?? getNextBibNumber(existing);

    if (existing.some((r) => r.bib === finalBib)) {
      return { ok: false, error: `Bib number ${finalBib} is already in use` };
    }

    const runner = await db.addRunner(createServerClient(), {
      bib: finalBib,
      name: name.trim(),
      gender: gender as Gender,
      notes: notes || null,
      edition_year: editionYear,
    });
    return { ok: true, data: runner };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function handleDeleteLap(
  lapId: string,
  inputPassword: string,
  serverPassword: string
): Promise<Result> {
  const authErr = requireAuth(inputPassword, serverPassword);
  if (authErr) return { ok: false, error: authErr };

  if (!lapId) return { ok: false, error: "Lap ID is required" };

  try {
    await db.deleteLap(createServerClient(), lapId);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function handleEditLapTimestamp(
  body: { lapId: string; timestamp: string },
  inputPassword: string,
  serverPassword: string
): Promise<Result> {
  const authErr = requireAuth(inputPassword, serverPassword);
  if (authErr) return { ok: false, error: authErr };

  if (!body.lapId) return { ok: false, error: "Lap ID is required" };

  const tsErr = validateTimestamp(body.timestamp);
  if (tsErr) return { ok: false, error: tsErr };

  try {
    const lap = await db.updateLapTimestamp(
      createServerClient(),
      body.lapId,
      body.timestamp
    );
    return { ok: true, data: lap };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function handleInsertBackdatedLap(
  body: { runnerId: string; timestamp: string },
  inputPassword: string,
  serverPassword: string
): Promise<Result> {
  const authErr = requireAuth(inputPassword, serverPassword);
  if (authErr) return { ok: false, error: authErr };

  if (!body.runnerId) return { ok: false, error: "Runner ID is required" };

  const tsErr = validateTimestamp(body.timestamp);
  if (tsErr) return { ok: false, error: tsErr };

  try {
    const supabase = createServerClient();
    const existingLaps = await db.getLapsForRunner(supabase, body.runnerId);
    const { newLapNumber, updates } = renumberLaps(existingLaps, body.timestamp);
    const lap = await db.insertBackdatedLap(
      supabase,
      body.runnerId,
      body.timestamp,
      newLapNumber,
      updates
    );
    return { ok: true, data: lap };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
