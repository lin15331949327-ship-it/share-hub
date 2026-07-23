import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ role: string; filename: string }> }
) {
  const { role, filename } = await params;
  // Security: only allow admin/editor roles
  if (role !== "admin" && role !== "editor") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const safeName = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, role, safeName);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const buf = await readFile(filePath);
  return new NextResponse(buf, {
    headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${safeName}"` },
  });
}
