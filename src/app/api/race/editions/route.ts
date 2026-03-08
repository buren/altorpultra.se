import { NextRequest, NextResponse } from "next/server";
import {
  getPublishedEditions,
  getAllEditions,
  getEdition,
  createEdition,
  updateEdition as updateEditionDb,
  deleteEdition as deleteEditionDb,
  resolveCurrentEditionFromDb,
  getRunners,
} from "@/lib/race/db";
import { Edition } from "@/lib/race/editions";
import { createServerClient } from "@/lib/race/supabase-server";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest): boolean {
  const password = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  return !!serverPassword && password === serverPassword;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const admin = isAdmin(req);

    const yearParam = new URL(req.url).searchParams.get("year");
    if (yearParam) {
      const edition = await getEdition(supabase, Number(yearParam));
      if (!edition) {
        return NextResponse.json({ ok: false, error: "Edition not found" }, { status: 404 });
      }
      // Non-admins can only see published editions
      if (!admin && !edition.publishedAt) {
        return NextResponse.json({ ok: false, error: "Edition not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, data: edition });
    }

    const editions = admin
      ? await getAllEditions(supabase)
      : await getPublishedEditions(supabase);

    const current = await resolveCurrentEditionFromDb(supabase);

    return NextResponse.json({
      ok: true,
      data: { editions, currentYear: current?.year ?? null },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const body = await req.json();

    const duplicateFrom = new URL(req.url).searchParams.get("duplicate_from");
    if (duplicateFrom) {
      const source = await getEdition(supabase, Number(duplicateFrom));
      if (!source) {
        return NextResponse.json({ ok: false, error: "Source edition not found" }, { status: 404 });
      }
      // Copy config, use new year, clear publishedAt (start as draft)
      const newEdition: Edition = {
        ...source,
        year: body.year,
        publishedAt: null,
      };
      const created = await createEdition(supabase, newEdition);
      return NextResponse.json({ ok: true, data: created }, { status: 201 });
    }

    const edition = await createEdition(supabase, body as Edition);
    return NextResponse.json({ ok: true, data: edition }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const body = await req.json();
    const { year, ...updates } = body;

    if (!year) {
      return NextResponse.json({ ok: false, error: "Year is required" }, { status: 400 });
    }

    const edition = await updateEditionDb(supabase, year, updates);
    return NextResponse.json({ ok: true, data: edition });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const year = Number(new URL(req.url).searchParams.get("year"));

    if (!year) {
      return NextResponse.json({ ok: false, error: "Year is required" }, { status: 400 });
    }

    // Check if runners exist for this edition
    const runners = await getRunners(supabase, year);
    if (runners.length > 0) {
      return NextResponse.json(
        { ok: false, error: `Cannot delete edition with ${runners.length} runner(s). Remove runners first.` },
        { status: 400 }
      );
    }

    await deleteEditionDb(supabase, year);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
