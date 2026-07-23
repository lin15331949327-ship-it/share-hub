import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie, clearSession } from "@/lib/auth";
import { authenticate, changePassword } from "@/lib/auth-actions";

// POST /api/auth — login
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const result = await authenticate(password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const isSecure = req.headers.get("x-forwarded-proto") === "https";
  await setSessionCookie(result.user, isSecure);
  return NextResponse.json({ role: result.user.role });
}

// GET /api/auth — check session
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ role: session?.role ?? null });
}

// PUT /api/auth — change password (admin only)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { target, oldPassword, newPassword } = await req.json();
  const result = await changePassword(target, oldPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/auth — logout
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
