import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-guards";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// POST /api/upload — simple upload (≤50MB)
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._\-一-鿿]/g, "_");
  const destDir = path.join(UPLOAD_DIR, auth.role);
  if (!existsSync(destDir)) await mkdir(destDir, { recursive: true });

  const buf = Buffer.from(await file.arrayBuffer());
  const dest = path.join(destDir, `${Date.now()}_${safeName}`);
  await writeFile(dest, buf);

  const url = `/api/upload/${auth.role}/${encodeURIComponent(path.basename(dest))}`;
  return NextResponse.json({ url });
}
