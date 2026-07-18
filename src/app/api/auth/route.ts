import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie, clearSession } from "@/lib/auth";
import { getAdminPassword, getEditorPassword } from "@/lib/kv";
import { compare } from "@/lib/hash";

// POST /api/auth — login
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const adminHash = await getAdminPassword();
  if (adminHash && (await compare(password, adminHash))) {
    await setSessionCookie({ role: "admin" });
    return NextResponse.json({ role: "admin" });
  }

  const editorHash = await getEditorPassword();
  if (editorHash && (await compare(password, editorHash))) {
    await setSessionCookie({ role: "editor" });
    return NextResponse.json({ role: "editor" });
  }

  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}

// GET /api/auth — me
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ role: null });
  }
  return NextResponse.json({ role: session.role });
}

// DELETE /api/auth — logout
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
