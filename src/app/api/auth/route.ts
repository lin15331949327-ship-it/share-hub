import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie, clearSession } from "@/lib/auth";
import { getAdminPassword, getEditorPassword, setAdminPassword, setEditorPassword } from "@/lib/kv";
import { compare, hash } from "@/lib/hash";

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

// PUT /api/auth — change password (admin only)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { target, oldPassword, newPassword } = await req.json();
  if (!target || !oldPassword || !newPassword) {
    return NextResponse.json({ error: "target, oldPassword, newPassword required" }, { status: 400 });
  }
  if (!["admin", "editor"].includes(target)) {
    return NextResponse.json({ error: "target must be admin or editor" }, { status: 400 });
  }
  if (newPassword.length < 3) {
    return NextResponse.json({ error: "新密码至少3位" }, { status: 400 });
  }

  const stored = target === "admin" ? await getAdminPassword() : await getEditorPassword();
  if (!stored || !(await compare(oldPassword, stored))) {
    return NextResponse.json({ error: "旧密码错误" }, { status: 403 });
  }

  const newHash = await hash(newPassword);
  if (target === "admin") {
    await setAdminPassword(newHash);
  } else {
    await setEditorPassword(newHash);
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/auth — logout
export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
