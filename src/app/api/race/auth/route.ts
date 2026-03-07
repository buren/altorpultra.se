import { NextRequest, NextResponse } from "next/server";
import { handleAuth } from "@/lib/race/api-handlers";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("race_admin")?.value ?? "";
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  const result = await handleAuth(cookie, serverPassword);
  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const serverPassword = process.env.RACE_ADMIN_PASSWORD ?? "";
  const result = await handleAuth(password, serverPassword);

  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  const response = NextResponse.json(result);
  response.cookies.set("race_admin", password, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return response;
}
