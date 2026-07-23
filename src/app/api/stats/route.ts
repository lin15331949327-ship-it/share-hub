import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

async function getLocalStats() {
  let objects = 0;
  let totalBytes = 0;

  for (const role of ["admin", "editor"]) {
    const dir = path.join(UPLOAD_DIR, role);
    if (!existsSync(dir)) continue;
    const files = await readdir(dir);
    for (const f of files) {
      try {
        const s = await stat(path.join(dir, f));
        totalBytes += s.size;
        objects++;
      } catch { /* skip */ }
    }
  }

  const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
  const quotaGB = 40; // Alibaba ECS system disk
  const percentUsed = ((totalBytes / (quotaGB * 1024 * 1024 * 1024)) * 100).toFixed(1);

  return { objects, totalBytes, totalMB, quotaGB, percentUsed };
}

export async function GET() {
  const session = await getSession();
  const stats = await getLocalStats();
  return NextResponse.json({ ...stats, role: session?.role });
}
