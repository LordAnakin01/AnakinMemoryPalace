import { NextResponse } from "next/server";
import { isAuthed } from "../../../lib/auth";
import { getPalaces, savePalaces } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAuthed(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const palaces = await getPalaces();
  return NextResponse.json(palaces);
}

export async function PUT(request) {
  if (!isAuthed(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const palaces = await request.json();
  await savePalaces(palaces);
  return NextResponse.json({ ok: true });
}
