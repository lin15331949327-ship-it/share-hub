import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, appendFile, mkdir, readdir, readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const TMP_DIR = path.join(UPLOAD_DIR, ".tmp");

// ── POST /api/upload/mp?action=start ──
// ── POST /api/upload/mp?action=part  ──
// ── POST /api/upload/mp?action=complete ──

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const action = req.nextUrl.searchParams.get("action");
  if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

  switch (action) {
    case "start": return handleStart(req, session.role);
    case "part": return handlePart(req);
    case "complete": return handleComplete(req, session.role);
    default: return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

async function handleStart(req: NextRequest, role: string) {
  const { filename } = await req.json();
  if (!filename) return NextResponse.json({ error: "Missing filename" }, { status: 400 });
  const id = crypto.randomUUID().slice(0, 8);
  const dir = path.join(TMP_DIR, id);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "meta.json"), JSON.stringify({ filename, role, id }));
  return NextResponse.json({ uploadId: id });
}

async function handlePart(req: NextRequest) {
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  const part = parseInt(req.nextUrl.searchParams.get("part") || "0", 10);
  if (!uploadId || !part) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const dir = path.join(TMP_DIR, uploadId);
  if (!existsSync(dir)) return NextResponse.json({ error: "Upload not found" }, { status: 404 });

  const buf = Buffer.from(await req.arrayBuffer());
  await writeFile(path.join(dir, `part_${String(part).padStart(5, "0")}`), buf);
  return NextResponse.json({ ok: true });
}

async function handleComplete(req: NextRequest, role: string) {
  const { uploadId } = await req.json();
  const dir = path.join(TMP_DIR, uploadId);
  if (!existsSync(dir)) return NextResponse.json({ error: "Upload not found" }, { status: 404 });

  const meta = JSON.parse(await readFile(path.join(dir, "meta.json"), "utf-8"));
  const safeName = (meta.filename as string).replace(/[^a-zA-Z0-9._\-一-鿿]/g, "_");
  const destDir = path.join(UPLOAD_DIR, role);
  if (!existsSync(destDir)) await mkdir(destDir, { recursive: true });

  // Sort parts and concatenate
  const partFiles = (await readdir(dir))
    .filter((f: string) => f.startsWith("part_"))
    .sort();

  const dest = path.join(destDir, `${Date.now()}_${safeName}`);
  for (const pf of partFiles) {
    const chunk = await readFile(path.join(dir, pf));
    await appendFile(dest, chunk);
  }

  // Cleanup temp
  for (const pf of partFiles) await unlink(path.join(dir, pf));
  await unlink(path.join(dir, "meta.json"));
  await (await import("fs/promises")).rmdir(dir);

  const url = `/api/upload/${role}/${encodeURIComponent(path.basename(dest))}`;
  return NextResponse.json({ url });
}
